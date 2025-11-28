/**
 * Points calculation and management utilities
 */
import { supabaseAdmin } from '../config/supabaseClient';

export interface PointsUpdate {
  points: number;
  totalDistanceKm: number;
  totalCo2SavedKg: number;
}

/**
 * Initialize user points record if it doesn't exist
 */
export async function ensureUserPoints(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('user_points')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Record doesn't exist, create it
    await supabaseAdmin
      .from('user_points')
      .insert({
        user_id: userId,
        points: 0,
        total_distance_km: 0,
        total_co2_saved_kg: 0,
      });
  }
}

/**
 * Award points to a user
 */
export async function awardPoints(
  userId: string,
  points: number,
  distanceKm?: number,
  co2SavedKg?: number
): Promise<void> {
  await ensureUserPoints(userId);

  // Get current values
  const { data: current } = await supabaseAdmin
    .from('user_points')
    .select('points, total_distance_km, total_co2_saved_kg')
    .eq('user_id', userId)
    .single();

  if (!current) return;

  const updateData: any = {
    points: (current.points || 0) + points,
  };

  if (distanceKm !== undefined) {
    updateData.total_distance_km = (parseFloat(current.total_distance_km) || 0) + distanceKm;
  }

  if (co2SavedKg !== undefined) {
    updateData.total_co2_saved_kg = (parseFloat(current.total_co2_saved_kg) || 0) + co2SavedKg;
  }

  await supabaseAdmin
    .from('user_points')
    .update(updateData)
    .eq('user_id', userId);
}

/**
 * Deduct points from a user (for coupon redemption)
 */
export async function deductPoints(userId: string, points: number): Promise<boolean> {
  await ensureUserPoints(userId);

  // Check if user has enough points
  const { data: userPoints } = await supabaseAdmin
    .from('user_points')
    .select('points')
    .eq('user_id', userId)
    .single();

  if (!userPoints || (userPoints.points || 0) < points) {
    return false;
  }

  await supabaseAdmin
    .from('user_points')
    .update({
      points: (userPoints.points || 0) - points,
    })
    .eq('user_id', userId);

  return true;
}

/**
 * Get user points
 */
export async function getUserPoints(userId: string): Promise<PointsUpdate | null> {
  await ensureUserPoints(userId);

  const { data, error } = await supabaseAdmin
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    points: data.points || 0,
    totalDistanceKm: parseFloat(data.total_distance_km) || 0,
    totalCo2SavedKg: parseFloat(data.total_co2_saved_kg) || 0,
  };
}

/**
 * Award points for completed ride
 * Driver: +20 points
 * Each passenger: +10 points
 */
export async function awardPointsForCompletedRide(
  rideId: string,
  driverId: string,
  passengerIds: string[],
  distanceKm: number,
  co2SavedKg: number
): Promise<void> {
  // Award points to driver
  await awardPoints(driverId, 20, distanceKm, co2SavedKg);

  // Award points to each passenger
  for (const passengerId of passengerIds) {
    await awardPoints(passengerId, 10, distanceKm, co2SavedKg);
  }
}

/**
 * Award points for a ride if all passengers have paid
 * Only awards if:
 * - Ride is completed
 * - Points not already awarded (points_awarded = false)
 * - All passengers have payment_status in ('paid', 'paid_full')
 * 
 * Driver: +20 points
 * Each passenger: +10 points
 */
export async function awardPointsForRideIfEligible(rideId: string): Promise<boolean> {
  try {
    // Get ride details
    const { data: ride, error: rideError } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      console.error('Ride not found:', rideId);
      return false;
    }

    // Skip if points already awarded
    if (ride.points_awarded) {
      return false;
    }

    // Skip if ride is not completed
    if (ride.status !== 'completed') {
      return false;
    }

    // Get all passengers for this ride
    const { data: passengers, error: passengersError } = await supabaseAdmin
      .from('ride_passengers')
      .select('*')
      .eq('ride_id', rideId)
      .in('status', ['accepted', 'completed']);

    if (passengersError || !passengers || passengers.length === 0) {
      console.error('No passengers found for ride:', rideId);
      return false;
    }

    // Check if all passengers have paid
    const allPaid = passengers.every((p: any) => 
      p.payment_status === 'paid' || p.payment_status === 'paid_full'
    );

    if (!allPaid) {
      // Not all passengers have paid yet
      return false;
    }

    // All passengers have paid - award points
    const distanceKm = parseFloat(ride.distance_km) || 0;
    const co2SavedKg = parseFloat(ride.co2_saved_kg) || 0;
    const passengerIds = passengers.map((p: any) => p.passenger_id);

    // Award points to driver
    await awardPoints(ride.driver_id, 20, distanceKm, co2SavedKg);

    // Award points to each passenger
    for (const passengerId of passengerIds) {
      await awardPoints(passengerId, 10, distanceKm, co2SavedKg);
    }

    // Mark points as awarded
    await supabaseAdmin
      .from('rides')
      .update({ points_awarded: true })
      .eq('id', rideId);

    console.log(`Points awarded for ride ${rideId}: Driver +20, ${passengerIds.length} passengers +10 each`);
    return true;
  } catch (error) {
    console.error('Error awarding points for ride:', error);
    return false;
  }
}

