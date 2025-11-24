/**
 * Calculate fare share for a passenger based on distance
 */
export function calculateFareShare(
  totalFuelCost: number,
  totalDistanceKm: number,
  passengerDistanceKm: number
): number {
  if (totalDistanceKm === 0) return 0;
  return (passengerDistanceKm / totalDistanceKm) * totalFuelCost;
}

/**
 * Estimate total fuel cost for a ride
 * This is a simplified calculation - in production, use real-time fuel prices
 */
export function estimateFuelCost(
  distanceKm: number,
  vehicleType: 'car' | 'bike' | 'scooter'
): number {
  // Fuel efficiency (km per liter) and fuel price per liter
  const fuelEfficiency: Record<string, number> = {
    car: 12, // 12 km/L
    bike: 40, // 40 km/L
    scooter: 35, // 35 km/L
  };

  const fuelPricePerLiter = 100; // ₹100 per liter (example)
  const efficiency = fuelEfficiency[vehicleType] || 12;
  const litersNeeded = distanceKm / efficiency;

  return litersNeeded * fuelPricePerLiter;
}
