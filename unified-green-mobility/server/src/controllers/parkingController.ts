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

      const { data: spots, error } = await supabaseAdmin
        .from('parking_spots')
        .select('*')
        .eq('parking_lot_id', id)
        .order('spot_number');

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch parking spots' });
      }

      // Get active reservations for these spots to update their status
      if (spots && spots.length > 0) {
        const spotIds = spots.map(s => s.id);
        const now = new Date();
        
        const { data: activeReservations } = await supabaseAdmin
          .from('parking_reservations')
          .select('parking_spot_id, status, start_time, end_time')
          .in('parking_spot_id', spotIds)
          .in('status', ['upcoming', 'active']);

        // Update spot statuses based on active reservations
        if (activeReservations && activeReservations.length > 0) {
          const reservationMap = new Map();
          activeReservations.forEach((res: any) => {
            const startTime = new Date(res.start_time);
            const endTime = new Date(res.end_time);
            
            // Determine actual status
            let actualStatus = res.status;
            if (res.status === 'upcoming' && startTime <= now) {
              actualStatus = 'active';
            } else if (res.status === 'active' && endTime <= now) {
              actualStatus = 'completed';
            }
            
            // Update spot status based on reservation
            if (actualStatus === 'active') {
              reservationMap.set(res.parking_spot_id, 'occupied');
            } else if (actualStatus === 'upcoming') {
              reservationMap.set(res.parking_spot_id, 'reserved');
            }
          });

          // Update spots with reservation status
          spots.forEach((spot: any) => {
            if (reservationMap.has(spot.id)) {
              spot.status = reservationMap.get(spot.id);
            }
          });

          // Also update the database to keep it in sync (batch update)
          const updatePromises = Array.from(reservationMap.entries()).map(([spotId, status]) =>
            supabaseAdmin
              .from('parking_spots')
              .update({ status })
              .eq('id', spotId)
          );
          await Promise.all(updatePromises);
        }
      }

      // Ensure all spots have a status field (default to 'available' if missing)
      const spotsWithStatus = (spots || []).map((spot: any) => {
        const status = spot.status || 'available';
        return {
          ...spot,
          status: status,
        };
      });

      console.log(`Returning ${spotsWithStatus.length} spots for parking lot ${id}`);
      if (spotsWithStatus.length > 0) {
        console.log('Sample spot:', {
          id: spotsWithStatus[0].id,
          spot_number: spotsWithStatus[0].spot_number,
          status: spotsWithStatus[0].status,
        });
      }

      // Return just the spots array (frontend expects array)
      res.json(spotsWithStatus);
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

      // Validate that end_time is after start_time
      const startTime = new Date(start_time);
      const endTime = new Date(end_time);
      
      if (endTime <= startTime) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      // Validate minimum duration (1 hour)
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      if (hours < 1) {
        return res.status(400).json({ error: 'Minimum reservation duration is 1 hour' });
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

      // Check for overlapping reservations (using startTime and endTime already declared above)
      const { data: overlapping } = await supabaseAdmin
        .from('parking_reservations')
        .select('*')
        .eq('parking_spot_id', parking_spot_id)
        .in('status', ['upcoming', 'active'])
        .gte('start_time', startTime.toISOString())
        .lte('start_time', endTime.toISOString());

      if (overlapping && overlapping.length > 0) {
        return res.status(400).json({ error: 'Spot is already reserved for this time' });
      }

      // Determine reservation status based on start time
      const now = new Date();
      const reservationStatus = startTime <= now ? 'active' : 'upcoming';

      // Create reservation
      const { data: reservation, error: reservationError } = await supabaseAdmin
        .from('parking_reservations')
        .insert({
          user_id: req.user.id,
          parking_spot_id,
          start_time,
          end_time,
          status: reservationStatus,
          amount_paid: amount_paid || 0,
          payment_status: 'pending', // Default to pending until payment is confirmed
        })
        .select('*, parking_spot:parking_spots!parking_reservations_parking_spot_id_fkey(*, parking_lot:parking_lots(*))')
        .single();

      if (reservationError) {
        console.error('Reservation insert error:', reservationError);
        return res.status(400).json({ error: reservationError.message || 'Failed to create reservation' });
      }

      // Update spot status based on reservation status
      const spotStatus = reservationStatus === 'active' ? 'occupied' : 'reserved';
      const { error: updateError } = await supabaseAdmin
        .from('parking_spots')
        .update({ status: spotStatus })
        .eq('id', parking_spot_id);

      if (updateError) {
        console.error('Spot update error:', updateError);
        // Don't fail the request, but log the error
      }

      res.status(201).json(reservation);
    } catch (error: any) {
      console.error('Create reservation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updatePayment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { payment_method, transaction_id, amount } = req.body;

      // Get reservation
      const { data: reservation, error: reservationError } = await supabaseAdmin
        .from('parking_reservations')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.user.id)
        .single();

      if (reservationError || !reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      // Update reservation with payment info
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('parking_reservations')
        .update({
          amount_paid: amount || reservation.amount_paid || 0,
          payment_status: 'confirmed',
          payment_method: payment_method || null,
          transaction_id: transaction_id || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      // Create payment transaction record (if payment_transactions table exists)
      // For now, we'll just update the reservation

      res.json(updated);
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
        .select('*, parking_spot:parking_spots!parking_reservations_parking_spot_id_fkey(*, parking_lot:parking_lots(*))')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch reservations' });
      }

      // Auto-update reservation statuses based on time
      if (data) {
        const now = new Date();
        for (const reservation of data) {
          const startTime = new Date(reservation.start_time);
          const endTime = new Date(reservation.end_time);
          
          if (reservation.status === 'upcoming' && startTime <= now) {
            // Update to active
            await supabaseAdmin
              .from('parking_reservations')
              .update({ status: 'active' })
              .eq('id', reservation.id);
            
            // Update spot to occupied
            if (reservation.parking_spot_id) {
              await supabaseAdmin
                .from('parking_spots')
                .update({ status: 'occupied' })
                .eq('id', reservation.parking_spot_id);
            }
          } else if (reservation.status === 'active' && endTime <= now) {
            // Auto-complete expired reservations
            await supabaseAdmin
              .from('parking_reservations')
              .update({ status: 'completed' })
              .eq('id', reservation.id);
            
            // Update spot back to available
            if (reservation.parking_spot_id) {
              await supabaseAdmin
                .from('parking_spots')
                .update({ status: 'available' })
                .eq('id', reservation.parking_spot_id);
            }
          }
        }
        
        // Re-fetch after updates
        const { data: updatedData } = await supabaseAdmin
          .from('parking_reservations')
          .select('*, parking_spot:parking_spots!parking_reservations_parking_spot_id_fkey(*, parking_lot:parking_lots(*))')
          .eq('user_id', req.user.id)
          .order('created_at', { ascending: false });
        
        return res.json(updatedData || []);
      }

      res.json(data || []);
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
        .select('*, parking_spot:parking_spots!parking_reservations_parking_spot_id_fkey(*, parking_lot:parking_lots(*))')
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

  async completeReservation(req: AuthRequest, res: Response) {
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
        return res.status(400).json({ error: 'Reservation is already completed or cancelled' });
      }

      // Update reservation status to completed
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('parking_reservations')
        .update({ status: 'completed' })
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
      console.error('Complete reservation error:', error);
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

