import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';

export const kycController = {
  async submitKYC(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { document_type, document_number, document_image_url } = req.body;

      if (!document_type || !document_number) {
        return res.status(400).json({ error: 'Document type and number are required' });
      }

      // Create or update KYC record
      const { data: existingKYC } = await supabaseAdmin
        .from('user_kyc')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      let kycData;
      if (existingKYC) {
        // Update existing
        const { data, error } = await supabaseAdmin
          .from('user_kyc')
          .update({
            document_type,
            document_number,
            document_image_url,
            status: 'pending',
            reviewed_at: null,
            admin_reviewer_id: null,
          })
          .eq('user_id', req.user.id)
          .select()
          .single();

        if (error) {
          return res.status(400).json({ error: 'Failed to update KYC' });
        }
        kycData = data;
      } else {
        // Create new
        const { data, error } = await supabaseAdmin
          .from('user_kyc')
          .insert({
            user_id: req.user.id,
            document_type,
            document_number,
            document_image_url,
            status: 'pending',
          })
          .select()
          .single();

        if (error) {
          return res.status(400).json({ error: 'Failed to submit KYC' });
        }
        kycData = data;
      }

      // Update user KYC status
      await supabaseAdmin
        .from('users')
        .update({ kyc_status: 'pending' })
        .eq('id', req.user.id);

      res.json(kycData);
    } catch (error: any) {
      console.error('Submit KYC error:', error);
      res.status(500).json({ error: 'Failed to submit KYC' });
    }
  },

  async getPendingKYC(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { data, error } = await supabaseAdmin
        .from('user_kyc')
        .select('*, user:users!user_kyc_user_id_fkey(id, name, email, phone)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[KYC] Error fetching pending KYC:', error);
        return res.status(400).json({ error: 'Failed to fetch pending KYC', details: error.message });
      }

      console.log('[KYC] Found pending KYC records:', data?.length || 0);
      res.json(data || []);
    } catch (error: any) {
      console.error('Get pending KYC error:', error);
      res.status(500).json({ error: 'Failed to get pending KYC' });
    }
  },

  async approveKYC(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;

      // Get KYC record
      const { data: kyc, error: kycError } = await supabaseAdmin
        .from('user_kyc')
        .select('user_id')
        .eq('id', id)
        .single();

      if (kycError || !kyc) {
        return res.status(404).json({ error: 'KYC record not found' });
      }

      // Update KYC status
      const { data, error } = await supabaseAdmin
        .from('user_kyc')
        .update({
          status: 'approved',
          admin_reviewer_id: req.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to approve KYC' });
      }

      // Update user KYC status
      await supabaseAdmin
        .from('users')
        .update({ kyc_status: 'approved' })
        .eq('id', kyc.user_id);

      res.json(data);
    } catch (error: any) {
      console.error('Approve KYC error:', error);
      res.status(500).json({ error: 'Failed to approve KYC' });
    }
  },

  async rejectKYC(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;

      // Get KYC record
      const { data: kyc, error: kycError } = await supabaseAdmin
        .from('user_kyc')
        .select('user_id')
        .eq('id', id)
        .single();

      if (kycError || !kyc) {
        return res.status(404).json({ error: 'KYC record not found' });
      }

      // Update KYC status
      const { data, error } = await supabaseAdmin
        .from('user_kyc')
        .update({
          status: 'rejected',
          admin_reviewer_id: req.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to reject KYC' });
      }

      // Update user KYC status
      await supabaseAdmin
        .from('users')
        .update({ kyc_status: 'rejected' })
        .eq('id', kyc.user_id);

      res.json(data);
    } catch (error: any) {
      console.error('Reject KYC error:', error);
      res.status(500).json({ error: 'Failed to reject KYC' });
    }
  },
};

