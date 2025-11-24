import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { calculateCarpoolCO2Saved } from '../utils/co2Calculator';

export const rewardController = {
  async getLeaderboard(req: any, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // Get top users by points
      const { data: rewards, error: rewardsError } = await supabaseAdmin
        .from('user_rewards')
        .select('*, user:users(id, name, email)')
        .order('points', { ascending: false })
        .limit(limit);

      if (rewardsError) {
        return res.status(400).json({ error: 'Failed to fetch leaderboard' });
      }

      // Get CO2 stats for these users
      const userIds = rewards?.map((r) => r.user_id) || [];
      const { data: emissions } = await supabaseAdmin
        .from('user_emissions_stats')
        .select('*')
        .in('user_id', userIds);

      // Combine data
      const leaderboard = rewards?.map((reward) => {
        const emission = emissions?.find((e) => e.user_id === reward.user_id);
        return {
          rank: rewards.indexOf(reward) + 1,
          user: reward.user,
          points: reward.points,
          co2_saved_kg: emission?.total_co2_saved_kg || 0,
          total_distance_km: emission?.total_distance_km || 0,
        };
      });

      res.json(leaderboard);
    } catch (error: any) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getMyStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: emissions, error: emissionsError } = await supabaseAdmin
        .from('user_emissions_stats')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      const { data: rewards, error: rewardsError } = await supabaseAdmin
        .from('user_rewards')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      res.json({
        emissions: emissions || { total_distance_km: 0, total_co2_saved_kg: 0 },
        rewards: rewards || { points: 0 },
      });
    } catch (error: any) {
      console.error('Get my stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getMyRewards(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data, error } = await supabaseAdmin
        .from('user_rewards')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" - that's okay, we'll return default
        return res.status(400).json({ error: 'Failed to fetch rewards' });
      }

      res.json(data || { user_id: req.user.id, points: 0, updated_at: new Date().toISOString() });
    } catch (error: any) {
      console.error('Get my rewards error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

/**
 * Helper function to award points and update CO2 stats
 * Called when a ride is completed or parking is used
 */
export async function awardPointsForRide(
  userId: string,
  distanceKm: number,
  passengerCount: number
) {
  try {
    const co2Saved = calculateCarpoolCO2Saved(distanceKm, passengerCount);

    // Update or insert emissions stats
    const { data: existing } = await supabaseAdmin
      .from('user_emissions_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabaseAdmin
        .from('user_emissions_stats')
        .update({
          total_distance_km: existing.total_distance_km + distanceKm,
          total_co2_saved_kg: existing.total_co2_saved_kg + co2Saved,
        })
        .eq('user_id', userId);
    } else {
      await supabaseAdmin.from('user_emissions_stats').insert({
        user_id: userId,
        total_distance_km: distanceKm,
        total_co2_saved_kg: co2Saved,
      });
    }

    // Award points (10 points per km for carpool, 5 for parking)
    const pointsEarned = Math.round(distanceKm * 10);

    const { data: existingRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingRewards) {
      await supabaseAdmin
        .from('user_rewards')
        .update({
          points: existingRewards.points + pointsEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      await supabaseAdmin.from('user_rewards').insert({
        user_id: userId,
        points: pointsEarned,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error awarding points:', error);
  }
}

