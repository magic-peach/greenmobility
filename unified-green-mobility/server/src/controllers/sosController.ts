import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';

export const sosController = {
  async createSOS(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { ride_id, lat, lng, message } = req.body;

      if (!lat || !lng) {
        return res.status(400).json({ error: 'Location is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('sos_events')
        .insert({
          user_id: req.user.id,
          ride_id: ride_id || null,
          lat,
          lng,
          message: message || null,
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to create SOS event' });
      }

      // TODO: Send alert to admin/support team
      // TODO: Send email notification
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SOS ALERT] User ${req.user.id} triggered SOS at ${lat}, ${lng}`);
      }

      res.status(201).json(data);
    } catch (error: any) {
      console.error('Create SOS error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getMySOS(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data, error } = await supabaseAdmin
        .from('sos_events')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch SOS events' });
      }

      res.json(data || []);
    } catch (error: any) {
      console.error('Get my SOS error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

