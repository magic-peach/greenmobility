import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';

export const supportController = {
  async createTicket(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { subject, message } = req.body;

      if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('support_tickets')
        .insert({
          user_id: req.user.id,
          subject,
          message,
          status: 'open',
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to create support ticket' });
      }

      res.status(201).json(data);
    } catch (error: any) {
      console.error('Create ticket error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getMyTickets(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data, error } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch tickets' });
      }

      res.json(data || []);
    } catch (error: any) {
      console.error('Get my tickets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getAllTickets(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { status } = req.query;

      let query = supabaseAdmin
        .from('support_tickets')
        .select('*, user:users(id, name, email)')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch tickets' });
      }

      res.json(data || []);
    } catch (error: any) {
      console.error('Get all tickets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateTicketStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['open', 'in_progress', 'resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const { data, error } = await supabaseAdmin
        .from('support_tickets')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to update ticket' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Update ticket status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

