import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { haversineDistance, isWithinRadius } from '../utils/distanceUtils'
import { calculateFareShare, estimateFuelCost } from '../utils/fareCalculator'

export const rideController = {
  async createRide(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const {
        start_location_name,
        start_lat,
        start_lng,
        end_location_name,
        end_lat,
        end_lng,
        departure_time,
        vehicle_type,
        total_seats,
        estimated_fare,
      } = req.body

      const totalDistance = haversineDistance(start_lat, start_lng, end_lat, end_lng)
      const fuelCost = estimated_fare || estimateFuelCost(totalDistance, vehicle_type)

      const { data, error } = await supabaseAdmin
        .from('rides')
        .insert({
          driver_id: req.user.id,
          start_location_name,
          start_lat,
          start_lng,
          end_location_name,
          end_lat,
          end_lng,
          departure_time,
          vehicle_type,
          total_seats,
          available_seats: total_seats - 1, // Driver occupies one seat
          estimated_fare: fuelCost,
        })
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: 'Failed to create ride' })
      }

      res.status(201).json(data)
    } catch (error: any) {
      console.error('Create ride error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async searchRides(req: AuthRequest, res: Response) {
    try {
      const { start_lat, start_lng, end_lat, end_lng, radius_km = 5, time_window_hours = 2 } = req.query

      if (!start_lat || !start_lng || !end_lat || !end_lng) {
        return res.status(400).json({ error: 'Missing location parameters' })
      }

      const startLat = parseFloat(start_lat as string)
      const startLng = parseFloat(start_lng as string)
      const endLat = parseFloat(end_lat as string)
      const endLng = parseFloat(end_lng as string)
      const radius = parseFloat(radius_km as string)
      const timeWindow = parseFloat(time_window_hours as string)

      const now = new Date()
      const windowStart = new Date(now.getTime() - timeWindow * 60 * 60 * 1000)
      const windowEnd = new Date(now.getTime() + timeWindow * 60 * 60 * 1000)

      // Get all open rides
      const { data: rides, error } = await supabaseAdmin
        .from('rides')
        .select('*, driver:users(*)')
        .eq('status', 'open')
        .gte('departure_time', windowStart.toISOString())
        .lte('departure_time', windowEnd.toISOString())
        .gt('available_seats', 0)

      if (error) {
        console.error('Database error:', error);
        // If table doesn't exist, return empty array instead of error
        if (error.message?.includes('relation') || error.message?.includes('table')) {
          return res.json([]);
        }
        return res.status(400).json({ error: error.message || 'Failed to search rides' })
      }

      // Filter and rank rides by distance
      const matchedRides = rides
        ?.map((ride) => {
          const startDistance = haversineDistance(startLat, startLng, ride.start_lat, ride.start_lng)
          const endDistance = haversineDistance(endLat, endLng, ride.end_lat, ride.end_lng)
          const avgDistance = (startDistance + endDistance) / 2

          return {
            ...ride,
            start_distance_km: startDistance,
            end_distance_km: endDistance,
            avg_distance_km: avgDistance,
          }
        })
        .filter((ride) => ride.start_distance_km <= radius && ride.end_distance_km <= radius)
        .sort((a, b) => a.avg_distance_km - b.avg_distance_km) || []

      res.json(matchedRides)
    } catch (error: any) {
      console.error('Search rides error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async joinRide(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { rideId } = req.params
      const {
        pickup_location_name,
        pickup_lat,
        pickup_lng,
        drop_location_name,
        drop_lat,
        drop_lng,
      } = req.body

      // Get ride details
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single()

      if (rideError || !ride) {
        return res.status(404).json({ error: 'Ride not found' })
      }

      if (ride.available_seats <= 0) {
        return res.status(400).json({ error: 'No available seats' })
      }

      // Calculate passenger distance and fare
      const passengerDistance = haversineDistance(
        pickup_lat,
        pickup_lng,
        drop_lat,
        drop_lng
      )
      const totalRideDistance = haversineDistance(
        ride.start_lat,
        ride.start_lng,
        ride.end_lat,
        ride.end_lng
      )
      const fareShare = calculateFareShare(
        ride.estimated_fare || 0,
        totalRideDistance,
        passengerDistance
      )

      // Create passenger request
      const { data, error } = await supabaseAdmin
        .from('ride_passengers')
        .insert({
          ride_id: rideId,
          passenger_id: req.user.id,
          pickup_location_name,
          pickup_lat,
          pickup_lng,
          drop_location_name,
          drop_lat,
          drop_lng,
          distance_km: passengerDistance,
          fare_share: fareShare,
          status: 'requested',
        })
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: 'Failed to join ride' })
      }

      res.status(201).json(data)
    } catch (error: any) {
      console.error('Join ride error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async updatePassengerStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { rideId, passengerId } = req.params
      const { status } = req.body

      // Verify user is the driver
      const { data: ride } = await supabase
        .from('rides')
        .select('driver_id')
        .eq('id', rideId)
        .single()

      if (!ride || ride.driver_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the driver can update passenger status' })
      }

      // Update passenger status
      const { data, error } = await supabaseAdmin
        .from('ride_passengers')
        .update({ status })
        .eq('id', passengerId)
        .eq('ride_id', rideId)
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: 'Failed to update passenger status' })
      }

      // If accepted, decrease available seats
      if (status === 'accepted') {
        await supabase.rpc('decrement_available_seats', { ride_id: rideId })
      }

      res.json(data)
    } catch (error: any) {
      console.error('Update passenger status error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async getMyRides(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { data, error } = await supabaseAdmin
        .from('rides')
        .select('*, passengers:ride_passengers(*)')
        .eq('driver_id', req.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch rides' })
      }

      res.json(data)
    } catch (error: any) {
      console.error('Get my rides error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async getMyJoinedRides(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { data, error } = await supabaseAdmin
        .from('ride_passengers')
        .select('*, ride:rides(*)')
        .eq('passenger_id', req.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch joined rides' })
      }

      res.json(data)
    } catch (error: any) {
      console.error('Get my joined rides error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async getRideById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const { data, error } = await supabaseAdmin
        .from('rides')
        .select('*, driver:users(*), passengers:ride_passengers(*)')
        .eq('id', id)
        .single()

      if (error || !data) {
        return res.status(404).json({ error: 'Ride not found' })
      }

      res.json(data)
    } catch (error: any) {
      console.error('Get ride by id error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async updateRideLocation(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { rideId } = req.params
      const { lat, lng } = req.body

      // Verify user is the driver
      const { data: ride } = await supabase
        .from('rides')
        .select('driver_id')
        .eq('id', rideId)
        .single()

      if (!ride || ride.driver_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the driver can update location' })
      }

      const { data, error } = await supabaseAdmin
        .from('ride_locations')
        .insert({
          ride_id: rideId,
          lat,
          lng,
        })
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: 'Failed to update location' })
      }

      res.json(data)
    } catch (error: any) {
      console.error('Update ride location error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async getRideLocations(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params

      const { data, error } = await supabaseAdmin
        .from('ride_locations')
        .select('*')
        .eq('ride_id', rideId)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch locations' })
      }

      res.json(data)
    } catch (error: any) {
      console.error('Get ride locations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async getRideMessages(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params

      const { data, error } = await supabaseAdmin
        .from('ride_messages')
        .select('*, sender:users(*)')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true })

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch messages' })
      }

      res.json(data)
    } catch (error: any) {
      console.error('Get ride messages error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async sendMessage(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { rideId } = req.params
      const { message } = req.body

      const { data, error } = await supabaseAdmin
        .from('ride_messages')
        .insert({
          ride_id: rideId,
          sender_id: req.user.id,
          message,
        })
        .select('*, sender:users(*)')
        .single()

      if (error) {
        return res.status(400).json({ error: 'Failed to send message' })
      }

      res.status(201).json(data)
    } catch (error: any) {
      console.error('Send message error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },

  async getRideDemand(req: AuthRequest, res: Response) {
    try {
      const { area, time } = req.query

      // Simple heuristic: count rides in similar areas/time windows
      // This is a placeholder for more sophisticated ML-based prediction
      const { data: rides, error } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'open')

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch ride demand' })
      }

      // Simple grouping by hour of day
      const hourlyCounts: Record<number, number> = {}
      rides?.forEach((ride) => {
        const hour = new Date(ride.departure_time).getHours()
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1
      })

      const peakHour = Object.entries(hourlyCounts).reduce((a, b) =>
        hourlyCounts[parseInt(a[0])] > hourlyCounts[parseInt(b[0])] ? a : b
      )?.[0]

      res.json({
        expected_rides: rides?.length || 0,
        recommendations: peakHour
          ? `More rides expected between ${peakHour}:00-${parseInt(peakHour) + 1}:00`
          : 'No significant patterns detected',
        hourly_distribution: hourlyCounts,
      })
    } catch (error: any) {
      console.error('Get ride demand error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  },
}

