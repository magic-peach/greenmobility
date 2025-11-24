import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';

export const adminController = {
  async getUsers(req: AuthRequest, res: Response) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch users' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getParkingLots(req: AuthRequest, res: Response) {
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

  async getRides(req: AuthRequest, res: Response) {
    try {
      const { status, limit = 100 } = req.query;

      let query = supabaseAdmin
        .from('rides')
        .select('*, driver:users(*)')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string));

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch rides' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Get rides error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getTrafficAnalytics(req: AuthRequest, res: Response) {
    try {
      const { days = 7 } = req.query;
      const daysNum = parseInt(days as string);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Get rides per day
      const { data: rides, error: ridesError } = await supabaseAdmin
        .from('rides')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString());

      if (ridesError) {
        return res.status(400).json({ error: 'Failed to fetch traffic analytics' });
      }

      // Group by date
      const dailyCounts: Record<string, { total: number; completed: number }> = {};
      rides?.forEach((ride) => {
        const date = new Date(ride.created_at).toISOString().split('T')[0];
        if (!dailyCounts[date]) {
          dailyCounts[date] = { total: 0, completed: 0 };
        }
        dailyCounts[date].total++;
        if (ride.status === 'completed') {
          dailyCounts[date].completed++;
        }
      });

      // Peak hours analysis
      const hourlyCounts: Record<number, number> = {};
      rides?.forEach((ride) => {
        const hour = new Date(ride.created_at).getHours();
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      });

      res.json({
        daily_counts: dailyCounts,
        hourly_distribution: hourlyCounts,
        total_rides: rides?.length || 0,
        completed_rides: rides?.filter((r) => r.status === 'completed').length || 0,
      });
    } catch (error: any) {
      console.error('Get traffic analytics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getParkingUsageAnalytics(req: AuthRequest, res: Response) {
    try {
      const { days = 7 } = req.query;
      const daysNum = parseInt(days as string);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Get reservations
      const { data: reservations, error: reservationsError } = await supabaseAdmin
        .from('parking_reservations')
        .select('*, parking_spot:parking_spots(parking_lot_id)')
        .gte('created_at', startDate.toISOString());

      if (reservationsError) {
        return res.status(400).json({ error: 'Failed to fetch parking usage' });
      }

      // Group by parking lot
      const lotUsage: Record<string, number> = {};
      reservations?.forEach((reservation) => {
        const lotId = (reservation.parking_spot as any)?.parking_lot_id;
        if (lotId) {
          lotUsage[lotId] = (lotUsage[lotId] || 0) + 1;
        }
      });

      // Get parking lot names
      const lotIds = Object.keys(lotUsage);
      const { data: lots } = await supabaseAdmin
        .from('parking_lots')
        .select('id, name')
        .in('id', lotIds);

      const usageWithNames = lots?.map((lot) => ({
        parking_lot_id: lot.id,
        parking_lot_name: lot.name,
        reservation_count: lotUsage[lot.id] || 0,
      }));

      // Get current occupancy
      const { data: spots } = await supabaseAdmin
        .from('parking_spots')
        .select('parking_lot_id, status');

      const occupancyByLot: Record<string, { total: number; occupied: number }> = {};
      spots?.forEach((spot) => {
        if (!occupancyByLot[spot.parking_lot_id]) {
          occupancyByLot[spot.parking_lot_id] = { total: 0, occupied: 0 };
        }
        occupancyByLot[spot.parking_lot_id].total++;
        if (spot.status === 'occupied' || spot.status === 'reserved') {
          occupancyByLot[spot.parking_lot_id].occupied++;
        }
      });

      res.json({
        usage_by_lot: usageWithNames,
        occupancy: occupancyByLot,
        total_reservations: reservations?.length || 0,
      });
    } catch (error: any) {
      console.error('Get parking usage analytics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getCO2SavedAnalytics(req: AuthRequest, res: Response) {
    try {
      const { data: emissions, error } = await supabaseAdmin
        .from('user_emissions_stats')
        .select('*');

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch CO2 analytics' });
      }

      const totalCO2Saved = emissions?.reduce((sum, e) => sum + e.total_co2_saved_kg, 0) || 0;
      const totalDistance = emissions?.reduce((sum, e) => sum + e.total_distance_km, 0) || 0;

      res.json({
        total_co2_saved_kg: totalCO2Saved,
        total_distance_km: totalDistance,
        average_co2_per_user: emissions && emissions.length > 0 ? totalCO2Saved / emissions.length : 0,
        user_count: emissions?.length || 0,
      });
    } catch (error: any) {
      console.error('Get CO2 saved analytics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

