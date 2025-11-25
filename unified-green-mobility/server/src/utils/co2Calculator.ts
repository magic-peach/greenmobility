/**
 * CO2 emissions factors (kg CO2 per km) by car category
 * Based on average values for different car types
 */
const EMISSIONS_FACTORS = {
  'hatchback': 0.14, // kg CO2 per km
  'sedan': 0.18,
  'suv': 0.22,
  'ev': 0.02, // Electric vehicle
  'other': 0.18,
} as const;

export type CarCategory = keyof typeof EMISSIONS_FACTORS;

/**
 * Calculate CO2 emissions for a given distance and car category
 */
export function calculateCO2(
  carCategory: CarCategory,
  distanceKm: number
): number {
  const factor = EMISSIONS_FACTORS[carCategory] || EMISSIONS_FACTORS['other'];
  return distanceKm * factor;
}

/**
 * Calculate CO2 saved for a carpool ride
 * Compares solo car trips vs shared carpool
 */
export function calculateCO2Saved(
  carCategory: CarCategory,
  distanceKm: number,
  passengersCount: number
): number {
  // If no passengers, no CO2 saved
  if (passengersCount === 0) {
    return 0;
  }

  // Average solo car emissions (using sedan as baseline)
  const soloEmissionsPerKm = EMISSIONS_FACTORS['sedan'];
  const totalSoloEmissions = soloEmissionsPerKm * distanceKm * passengersCount;

  // Carpool emissions (shared among all passengers + driver)
  const carpoolEmissionsPerKm = EMISSIONS_FACTORS[carCategory] || EMISSIONS_FACTORS['other'];
  const totalCarpoolEmissions = carpoolEmissionsPerKm * distanceKm;

  // CO2 saved = total solo emissions - carpool emissions
  return totalSoloEmissions - totalCarpoolEmissions;
}

/**
 * Get emission factor for a car category
 */
export function getEmissionFactor(carCategory: CarCategory): number {
  return EMISSIONS_FACTORS[carCategory] || EMISSIONS_FACTORS['other'];
}
