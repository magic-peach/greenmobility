import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { haversineDistance, isWithinRadius } from '../utils/distanceUtils'
import { calculateFareShare, estimateFuelCost } from '../utils/fareCalculator'
import { generateOTP } from '../utils/otp'
import { getDistanceAndETA } from '../utils/distance'
import { calculateCO2, calculateCO2Saved } from '../utils/co2Calculator'
import { awardPointsForCompletedRide, awardPointsForRideIfEligible } from '../utils/points'

export const rideController = {
  async createRide(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Check user is driver and KYC approved
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role, kyc_status')
        .eq('id', req.user.id)
        .single()

      if (user?.role !== 'driver') {
        return res.status(403).json({ error: 'Only drivers can create rides' })
      }

      if (user?.kyc_status !== 'approved') {
        return res.status(403).json({ error: 'KYC approval required to create rides' })
      }

      const {
        origin_name,
        origin_lat,
        origin_lng,
        destination_name,
        destination_lat,
        destination_lng,
        departure_time,
        car_brand,
        car_model,
        car_category,
        total_seats,
        max_passengers,
        estimated_fare,
      } = req.body

      // Support legacy field names
      const start_location_name = origin_name || req.body.start_location_name
      const start_lat = origin_lat || req.body.start_lat
      const start_lng = origin_lng || req.body.start_lng
      const end_location_name = destination_name || req.body.end_location_name
      const end_lat = destination_lat || req.body.end_lat
      const end_lng = destination_lng || req.body.end_lng
      const vehicle_type = req.body.vehicle_type || 'car'

      const totalDistance = haversineDistance(start_lat, start_lng, end_lat, end_lng)
      const fuelCost = estimated_fare || estimateFuelCost(totalDistance, vehicle_type)
      
      // Calculate max_passengers (default to total_seats - 1 if not provided)
      const calculatedMaxPassengers = max_passengers || (total_seats - 1)
      if (calculatedMaxPassengers < 1) {
        return res.status(400).json({ error: 'max_passengers must be at least 1' })
      }

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
          origin_name: start_location_name,
          origin_lat: start_lat,
          origin_lng: start_lng,
          destination_name: end_location_name,
          destination_lat: end_lat,
          destination_lng: end_lng,
          departure_time,
          vehicle_type,
          car_brand,
          car_model,
          car_category: car_category || 'other',
          total_seats,
          max_passengers: calculatedMaxPassengers,
          available_seats: total_seats - 1, // Driver occupies one seat
          estimated_fare: fuelCost,
          status: 'upcoming',
          points_awarded: false,
        })
        .select()
        .single()

      if (error) {
        return res.status(400).json({ error: 'Failed to create ride', details: error.message })
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

      // Get all upcoming rides
      const { data: rides, error } = await supabaseAdmin
        .from('rides')
        .select('*, driver:users(*)')
        .eq('status', 'upcoming')
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
      const { data: ride, error: rideError } = await supabaseAdmin
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single()

      if (rideError || !ride) {
        return res.status(404).json({ error: 'Ride not found' })
      }

      // Check user role - only passengers can join rides
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single()

      if (user?.role !== 'passenger') {
        return res.status(403).json({ error: 'Only passengers can join rides' })
      }

      // Check passenger limit
      const { data: acceptedPassengers } = await supabaseAdmin
        .from('ride_passengers')
        .select('id')
        .eq('ride_id', rideId)
        .in('status', ['accepted', 'completed'])

      const currentPassengerCount = acceptedPassengers?.length || 0
      const maxPassengers = ride.max_passengers || (ride.total_seats - 1)

      if (currentPassengerCount >= maxPassengers) {
        return res.status(409).json({ error: 'Passenger limit reached for this ride.' })
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

      // If accepted, decrease available seats and generate OTP
      if (status === 'accepted') {
        const otpCode = generateOTP();
        await supabaseAdmin
          .from('ride_passengers')
          .update({ otp_code: otpCode })
          .eq('id', passengerId);
        
        await supabaseAdmin.rpc('decrement_available_seats', { ride_id: rideId });
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

  async getDriverRides(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Verify user is a driver
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single()

      if (user?.role !== 'driver') {
        return res.status(403).json({ error: 'Only drivers can access this endpoint' })
      }

      // Fetch all rides created by this driver
      const { data: rides, error } = await supabaseAdmin
        .from('rides')
        .select(`
          *,
          passengers:ride_passengers!inner(
            id,
            passenger_id,
            status,
            payment_status
          )
        `)
        .eq('driver_id', req.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch driver rides' })
      }

      // Group rides by status and calculate passenger counts
      const groupedRides = rides?.map((ride: any) => {
        const acceptedPassengers = ride.passengers?.filter((p: any) => 
          p.status === 'accepted' || p.status === 'completed'
        ) || []
        
        return {
          ...ride,
          current_passenger_count: acceptedPassengers.length,
          max_passengers: ride.max_passengers || (ride.total_seats - 1),
        }
      }) || []

      res.json(groupedRides)
    } catch (error: any) {
      console.error('Get driver rides error:', error)
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
        .select(`
          *,
          ride:rides(
            *,
            driver:users!rides_driver_id_fkey(id, name, email)
          )
        `)
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
      const { data: rides, error } = await supabaseAdmin
        .from('rides')
        .select('*')
        .eq('status', 'upcoming')

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

  async requestRide(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rideId } = req.params;

      // Check user KYC status
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('kyc_status')
        .eq('id', req.user.id)
        .single();

      if (user?.kyc_status !== 'approved') {
        return res.status(403).json({ error: 'KYC approval required to join rides' });
      }

      // Get ride details
      const { data: ride, error: rideError } = await supabaseAdmin
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (rideError || !ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (ride.status !== 'upcoming') {
        return res.status(400).json({ error: 'Ride is not accepting requests' });
      }

      if (ride.available_seats <= 0) {
        return res.status(400).json({ error: 'No available seats' });
      }

      // Check if user already requested
      const { data: existingRequest } = await supabaseAdmin
        .from('ride_passengers')
        .select('id')
        .eq('ride_id', rideId)
        .eq('passenger_id', req.user.id)
        .single();

      if (existingRequest) {
        return res.status(400).json({ error: 'You have already requested this ride' });
      }

      // Create request (will be handled by joinRide, but this is the new endpoint name)
      res.status(200).json({ message: 'Ride request created', rideId });
    } catch (error: any) {
      console.error('Request ride error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async acceptPassenger(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rideId, passengerId } = req.params;

      // Verify user is the driver
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (!ride || ride.driver_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the driver can accept passengers' });
      }

      // Check passenger limit using max_passengers
      const { data: acceptedPassengers } = await supabaseAdmin
        .from('ride_passengers')
        .select('id')
        .eq('ride_id', rideId)
        .in('status', ['accepted', 'completed']);

      const currentPassengerCount = acceptedPassengers?.length || 0;
      const maxPassengers = ride.max_passengers || (ride.total_seats - 1);

      if (currentPassengerCount >= maxPassengers) {
        return res.status(409).json({ error: 'Passenger limit reached for this ride.' });
      }

      if (ride.available_seats <= 0) {
        return res.status(400).json({ error: 'Carpool limit exceeded for this ride' });
      }

      // Generate OTP
      const otpCode = generateOTP();

      // Update passenger status and set OTP
      const { data, error } = await supabaseAdmin
        .from('ride_passengers')
        .update({
          status: 'accepted',
          otp_code: otpCode,
          otp_verified: false,
        })
        .eq('id', passengerId)
        .eq('ride_id', rideId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to accept passenger' });
      }

      // Decrement available seats
      await supabaseAdmin.rpc('decrement_available_seats', { ride_id: rideId });

      res.json({ ...data, otp_code: otpCode }); // Return OTP for driver to share
    } catch (error: any) {
      console.error('Accept passenger error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async rejectPassenger(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rideId, passengerId } = req.params;

      // Verify user is the driver
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('driver_id')
        .eq('id', rideId)
        .single();

      if (!ride || ride.driver_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the driver can reject passengers' });
      }

      const { data, error } = await supabaseAdmin
        .from('ride_passengers')
        .update({ status: 'rejected' })
        .eq('id', passengerId)
        .eq('ride_id', rideId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to reject passenger' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Reject passenger error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async verifyOTP(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rideId, passengerId } = req.params;
      const { otp } = req.body;

      if (!otp) {
        return res.status(400).json({ error: 'OTP is required' });
      }

      // Verify user is the driver
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('driver_id')
        .eq('id', rideId)
        .single();

      if (!ride || ride.driver_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the driver can verify OTP' });
      }

      // Get passenger record
      const { data: passenger, error: passengerError } = await supabaseAdmin
        .from('ride_passengers')
        .select('*')
        .eq('id', passengerId)
        .eq('ride_id', rideId)
        .single();

      if (passengerError || !passenger) {
        return res.status(404).json({ error: 'Passenger not found' });
      }

      if (passenger.otp_code !== otp) {
        return res.status(401).json({ error: 'Invalid OTP' });
      }

      // Mark OTP as verified
      const { data, error } = await supabaseAdmin
        .from('ride_passengers')
        .update({ otp_verified: true })
        .eq('id', passengerId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to verify OTP' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async startRide(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rideId } = req.params;

      // Verify user is the driver
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (!ride || ride.driver_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the driver can start the ride' });
      }

      if (ride.status !== 'upcoming') {
        return res.status(400).json({ error: 'Ride cannot be started' });
      }

      // Check all accepted passengers have verified OTP
      const { data: passengers } = await supabaseAdmin
        .from('ride_passengers')
        .select('*')
        .eq('ride_id', rideId)
        .eq('status', 'accepted');

      const allVerified = passengers?.every(p => p.otp_verified === true) ?? true;

      if (!allVerified && passengers && passengers.length > 0) {
        return res.status(400).json({ error: 'All passengers must verify OTP before starting' });
      }

      // Update ride status
      const { data, error } = await supabaseAdmin
        .from('rides')
        .update({ status: 'ongoing' })
        .eq('id', rideId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to start ride' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Start ride error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async completeRide(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rideId } = req.params;

      // Verify user is the driver
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (!ride || ride.driver_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the driver can complete the ride' });
      }

      // Allow completion from 'ongoing' or 'upcoming' status
      if (ride.status !== 'ongoing' && ride.status !== 'upcoming') {
        return res.status(400).json({ error: 'Ride must be ongoing or upcoming to complete' });
      }

      // Calculate distance using Google Directions API
      const distanceResult = await getDistanceAndETA(
        parseFloat(ride.origin_lat || ride.start_lat),
        parseFloat(ride.origin_lng || ride.start_lng),
        parseFloat(ride.destination_lat || ride.end_lat),
        parseFloat(ride.destination_lng || ride.end_lng)
      );

      const distanceKm = distanceResult?.distanceKm || haversineDistance(
        parseFloat(ride.origin_lat || ride.start_lat),
        parseFloat(ride.origin_lng || ride.start_lng),
        parseFloat(ride.destination_lat || ride.end_lat),
        parseFloat(ride.destination_lng || ride.end_lng)
      );

      // Calculate CO2 emissions
      const carCategory = ride.car_category || 'other';
      const co2Emitted = calculateCO2(carCategory as any, distanceKm);
      const passengersCount = ride.total_seats - ride.available_seats - 1; // Exclude driver
      const co2Saved = calculateCO2Saved(carCategory as any, distanceKm, passengersCount);

      // Get accepted passengers
      const { data: passengers } = await supabaseAdmin
        .from('ride_passengers')
        .select('*')
        .eq('ride_id', rideId)
        .eq('status', 'accepted');

      const passengerIds = passengers?.map(p => p.passenger_id) || [];

      // Calculate fare for each passenger in INR (₹10 per km base rate)
      const baseFareINR = ride.estimated_fare || (distanceKm * 10); // ₹10 per km default
      const farePerPassengerINR = baseFareINR / (passengersCount + 1); // Share among all

      // Update passenger fare amounts (in INR) and set payment_status to 'split_pending'
      for (const passenger of passengers || []) {
        await supabaseAdmin
          .from('ride_passengers')
          .update({
            fare_amount: farePerPassengerINR, // Keep for backward compatibility
            fare_amount_inr: farePerPassengerINR, // Primary INR field
            payment_status: 'split_pending', // Changed from 'pending' to 'split_pending'
            status: 'completed',
          })
          .eq('id', passenger.id);
      }

      // Update ride - do NOT award points yet (wait for all payments)
      const { data: updatedRide, error: rideError } = await supabaseAdmin
        .from('rides')
        .update({
          status: 'completed',
          distance_km: distanceKm,
          co2_emitted_kg: co2Emitted,
          points_awarded: false, // Points not awarded until all payments complete
        })
        .eq('id', rideId)
        .select()
        .single();

      if (rideError) {
        return res.status(400).json({ error: 'Failed to complete ride' });
      }

      // DO NOT award points here - wait for all passengers to pay
      // Points will be awarded after each payment via awardPointsForRideIfEligible

      res.json(updatedRide);
    } catch (error: any) {
      console.error('Complete ride error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async closeRide(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rideId } = req.params;

      // Verify user is the driver
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('driver_id')
        .eq('id', rideId)
        .single();

      if (!ride || ride.driver_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the driver can close the ride' });
      }

      const { data, error } = await supabaseAdmin
        .from('rides')
        .update({ status: 'closed' })
        .eq('id', rideId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to close ride' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Close ride error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getPayments(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rideId } = req.params;

      // Verify user is the driver
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('driver_id')
        .eq('id', rideId)
        .single();

      if (!ride || ride.driver_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the driver can view payments' });
      }

      const { data, error } = await supabaseAdmin
        .from('ride_passengers')
        .select('*, passenger:users(id, name, email)')
        .eq('ride_id', rideId)
        .eq('status', 'accepted');

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch payments' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Get payments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async markPayment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rideId } = req.params;
      const { mode = 'split' } = req.body; // 'split' or 'full'

      // Verify user is a passenger
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', req.user.id)
        .single()

      if (user?.role !== 'passenger') {
        return res.status(403).json({ error: 'Only passengers can mark payment' });
      }

      // Get passenger record for this user
      const { data: passenger, error: passengerError } = await supabaseAdmin
        .from('ride_passengers')
        .select('*')
        .eq('ride_id', rideId)
        .eq('passenger_id', req.user.id)
        .single();

      if (passengerError || !passenger) {
        return res.status(404).json({ error: 'Passenger record not found' });
      }

      // Determine payment status based on mode
      const paymentStatus = mode === 'full' ? 'paid_full' : 'paid';

      const { data, error } = await supabaseAdmin
        .from('ride_passengers')
        .update({ payment_status: paymentStatus })
        .eq('id', passenger.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to mark payment' });
      }

      // Check if all passengers have paid and award points if eligible
      await awardPointsForRideIfEligible(rideId);

      res.json(data);
    } catch (error: any) {
      console.error('Mark payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async confirmPayment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rideId, passengerId } = req.params;

      // Verify user is the driver
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('driver_id')
        .eq('id', rideId)
        .single();

      if (!ride || ride.driver_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the driver can confirm payment' });
      }

      const { data, error } = await supabaseAdmin
        .from('ride_passengers')
        .update({ payment_status: 'confirmed' })
        .eq('id', passengerId)
        .eq('ride_id', rideId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to confirm payment' });
      }

      // Check if all payments are confirmed
      const { data: allPassengers } = await supabaseAdmin
        .from('ride_passengers')
        .select('payment_status')
        .eq('ride_id', rideId)
        .eq('status', 'accepted');

      const allConfirmed = allPassengers?.every(p => p.payment_status === 'confirmed') ?? false;

      if (allConfirmed && allPassengers && allPassengers.length > 0) {
        // Optionally auto-close ride
        await supabaseAdmin
          .from('rides')
          .update({ status: 'closed' })
          .eq('id', rideId);
      }

      res.json(data);
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getETA(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params;

      // Get latest location
      const { data: latestLocation } = await supabaseAdmin
        .from('ride_locations')
        .select('*')
        .eq('ride_id', rideId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      // Get ride destination
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      if (!latestLocation) {
        return res.status(400).json({ error: 'No location data available' });
      }

      // Calculate ETA
      const etaResult = await getDistanceAndETA(
        parseFloat(latestLocation.lat),
        parseFloat(latestLocation.lng),
        parseFloat(ride.destination_lat || ride.end_lat),
        parseFloat(ride.destination_lng || ride.end_lng)
      );

      if (!etaResult) {
        return res.status(500).json({ error: 'Failed to calculate ETA' });
      }

      res.json({
        distanceKm: etaResult.distanceKm,
        distanceText: etaResult.distanceText,
        durationSeconds: etaResult.durationSeconds,
        durationText: etaResult.durationText,
        eta: etaResult.eta,
        currentLocation: {
          lat: latestLocation.lat,
          lng: latestLocation.lng,
          timestamp: latestLocation.timestamp,
        },
      });
    } catch (error: any) {
      console.error('Get ETA error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
}

