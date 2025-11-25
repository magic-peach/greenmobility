import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { getUserPoints } from '../utils/points';

export const userController = {
  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (profileError || !profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user points
      const points = await getUserPoints(req.user.id);

      res.json({
        ...profile,
        points: points?.points || 0,
        totalDistanceKm: points?.totalDistanceKm || 0,
        totalCo2SavedKg: points?.totalCo2SavedKg || 0,
      });
    } catch (error: any) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, phone, avatar_url } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to update profile' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  async getStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user points
      const points = await getUserPoints(req.user.id);

      // Get ride statistics
      const { data: driverRides } = await supabaseAdmin
        .from('rides')
        .select('id')
        .eq('driver_id', req.user.id)
        .eq('status', 'completed');

      const { data: passengerRides } = await supabaseAdmin
        .from('ride_passengers')
        .select('id')
        .eq('passenger_id', req.user.id)
        .eq('status', 'completed');

      // Calculate monthly stats (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: monthlyDriverRides } = await supabaseAdmin
        .from('rides')
        .select('id')
        .eq('driver_id', req.user.id)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: monthlyPassengerRides } = await supabaseAdmin
        .from('ride_passengers')
        .select('id')
        .eq('passenger_id', req.user.id)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString());

      res.json({
        totalRidesAsDriver: driverRides?.length || 0,
        totalRidesAsPassenger: passengerRides?.length || 0,
        totalDistanceKm: points?.totalDistanceKm || 0,
        totalCo2SavedKg: points?.totalCo2SavedKg || 0,
        currentPoints: points?.points || 0,
        monthlyRides: (monthlyDriverRides?.length || 0) + (monthlyPassengerRides?.length || 0),
        monthlyPoints: 0, // Could calculate from points history if we add that table
      });
    } catch (error: any) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  },
};

