import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';

export const parkingController = {
  async getParkingLots(req: any, res: Response) {
    try {
      const { data, error } = await supabaseAdmin
        .from('parking_lots')
        .select('*')
        .order('name');

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch parking lots' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Get parking lots error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getParkingSpots(req: any, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('parking_spots')
        .select('*')
        .eq('parking_lot_id', id)
        .order('spot_number');

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch parking spots' });
      }

      // Group by status for summary
      const summary = {
        available: data?.filter((s) => s.status === 'available').length || 0,
        occupied: data?.filter((s) => s.status === 'occupied').length || 0,
        reserved: data?.filter((s) => s.status === 'reserved').length || 0,
        out_of_service: data?.filter((s) => s.status === 'out_of_service').length || 0,
      };

      res.json({ spots: data, summary });
    } catch (error: any) {
      console.error('Get parking spots error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async createReservation(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { parking_spot_id, start_time, end_time, amount_paid } = req.body;

      if (!parking_spot_id || !start_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if spot is available
      const { data: spot, error: spotError } = await supabaseAdmin
        .from('parking_spots')
        .select('*')
        .eq('id', parking_spot_id)
        .single();

      if (spotError || !spot) {
        return res.status(404).json({ error: 'Parking spot not found' });
      }

      if (spot.status !== 'available') {
        return res.status(400).json({ error: 'Spot is not available' });
      }

      // Check for overlapping reservations
      const { data: overlapping } = await supabaseAdmin
        .from('parking_reservations')
        .select('*')
        .eq('parking_spot_id', parking_spot_id)
        .in('status', ['upcoming', 'active'])
        .or(`start_time.lte.${end_time},end_time.gte.${start_time}`);

      if (overlapping && overlapping.length > 0) {
        return res.status(400).json({ error: 'Spot is already reserved for this time' });
      }

      // Create reservation
      const { data: reservation, error: reservationError } = await supabaseAdmin
        .from('parking_reservations')
        .insert({
          user_id: req.user.id,
          parking_spot_id,
          start_time,
          end_time,
          status: 'upcoming',
          amount_paid: amount_paid || 0,
        })
        .select('*, parking_spot:parking_spots(*, parking_lot:parking_lots(*))')
        .single();

      if (reservationError) {
        return res.status(400).json({ error: reservationError.message });
      }

      // Update spot status to reserved
      await supabaseAdmin
        .from('parking_spots')
        .update({ status: 'reserved' })
        .eq('id', parking_spot_id);

      res.status(201).json(reservation);
    } catch (error: any) {
      console.error('Create reservation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getMyReservations(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data, error } = await supabaseAdmin
        .from('parking_reservations')
        .select('*, parking_spot:parking_spots(*, parking_lot:parking_lots(*))')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch reservations' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Get my reservations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async cancelReservation(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

      // Get reservation
      const { data: reservation, error: reservationError } = await supabaseAdmin
        .from('parking_reservations')
        .select('*, parking_spot:parking_spots(*)')
        .eq('id', id)
        .eq('user_id', req.user.id)
        .single();

      if (reservationError || !reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      if (reservation.status === 'completed' || reservation.status === 'cancelled') {
        return res.status(400).json({ error: 'Cannot cancel this reservation' });
      }

      // Update reservation status
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('parking_reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      // Update spot status back to available
      await supabaseAdmin
        .from('parking_spots')
        .update({ status: 'available' })
        .eq('id', reservation.parking_spot_id);

      res.json(updated);
    } catch (error: any) {
      console.error('Cancel reservation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getReservationById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('parking_reservations')
        .select('*, parking_spot:parking_spots(*, parking_lot:parking_lots(*))')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Get reservation by id error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getParkingPrediction(req: any, res: Response) {
    try {
      const { parking_lot_id, time } = req.query;

      if (!parking_lot_id) {
        return res.status(400).json({ error: 'parking_lot_id is required' });
      }

      // Get total spots
      const { data: spots } = await supabaseAdmin
        .from('parking_spots')
        .select('id')
        .eq('parking_lot_id', parking_lot_id);

      const totalSpots = spots?.length || 0;

      if (totalSpots === 0) {
        return res.json({
          predicted_availability_percentage: 0,
          confidence: 0,
        });
      }

      // Simple heuristic: check historical reservations at similar times
      const targetTime = time ? new Date(time as string) : new Date();
      const hour = targetTime.getHours();
      const dayOfWeek = targetTime.getDay();

      // Get reservations for similar time slots (same hour, same day of week)
      const { data: reservations } = await supabaseAdmin
        .from('parking_reservations')
        .select('parking_spot_id')
        .eq('parking_lot_id', parking_lot_id)
        .gte('start_time', new Date(targetTime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte('start_time', new Date(targetTime.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());

      // Simple prediction: if we have data, use it; otherwise use time-based heuristic
      let predictedOccupied = 0;
      if (reservations && reservations.length > 0) {
        // Average occupancy from historical data
        predictedOccupied = Math.round((reservations.length / (7 * totalSpots)) * totalSpots);
      } else {
        // Time-based heuristic: peak hours (9-11 AM, 5-7 PM) have higher occupancy
        const isPeakHour = (hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 19);
        predictedOccupied = isPeakHour ? Math.round(totalSpots * 0.7) : Math.round(totalSpots * 0.3);
      }

      const predictedAvailable = Math.max(0, totalSpots - predictedOccupied);
      const availabilityPercentage = totalSpots > 0 ? (predictedAvailable / totalSpots) * 100 : 0;

      res.json({
        predicted_availability_percentage: Math.round(availabilityPercentage),
        confidence: reservations && reservations.length > 0 ? 0.7 : 0.3,
        total_spots: totalSpots,
        predicted_occupied: predictedOccupied,
      });
    } catch (error: any) {
      console.error('Get parking prediction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

