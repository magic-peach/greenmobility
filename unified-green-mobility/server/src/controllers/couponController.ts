import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { deductPoints } from '../utils/points';

export const couponController = {
  async getCoupons(req: AuthRequest, res: Response) {
    try {
      const { category } = req.query;

      let query = supabaseAdmin
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch coupons' });
      }

      res.json(data || []);
    } catch (error: any) {
      console.error('Get coupons error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async redeemCoupon(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { couponId } = req.params;

      // Get coupon details
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single();

      if (couponError || !coupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }

      // Check if user already redeemed this coupon
      const { data: existingRedemption } = await supabaseAdmin
        .from('user_coupons')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('coupon_id', couponId)
        .single();

      if (existingRedemption) {
        return res.status(400).json({ error: 'Coupon already redeemed' });
      }

      // Check if user has enough points
      const { data: userPoints } = await supabaseAdmin
        .from('user_points')
        .select('points')
        .eq('user_id', req.user.id)
        .single();

      if (!userPoints || (userPoints.points || 0) < coupon.points_required) {
        return res.status(400).json({ error: 'Insufficient points' });
      }

      // Deduct points
      const deducted = await deductPoints(req.user.id, coupon.points_required);
      if (!deducted) {
        return res.status(400).json({ error: 'Failed to deduct points' });
      }

      // Create redemption record
      const { data, error } = await supabaseAdmin
        .from('user_coupons')
        .insert({
          user_id: req.user.id,
          coupon_id: couponId,
        })
        .select('*, coupon:coupons(*)')
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to redeem coupon' });
      }

      res.json(data);
    } catch (error: any) {
      console.error('Redeem coupon error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getMyCoupons(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data, error } = await supabaseAdmin
        .from('user_coupons')
        .select('*, coupon:coupons(*)')
        .eq('user_id', req.user.id)
        .order('redeemed_at', { ascending: false });

      if (error) {
        return res.status(400).json({ error: 'Failed to fetch coupons' });
      }

      res.json(data || []);
    } catch (error: any) {
      console.error('Get my coupons error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

