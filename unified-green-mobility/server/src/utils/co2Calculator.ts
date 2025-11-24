/**
 * CO2 emissions factors (kg CO2 per km)
 * Based on average values for different transportation modes
 */
const EMISSIONS_FACTORS = {
  'solo-car': 0.21, // kg CO2 per km
  'carpool': 0.105, // Half of solo (assuming 2 passengers)
  'bike': 0.0, // Zero emissions
  'metro': 0.05, // Public transport
  'scooter': 0.08, // Electric scooter
} as const;

export type TransportMode = keyof typeof EMISSIONS_FACTORS;

/**
 * Calculate CO2 emissions for a given distance and transport mode
 */
export function calculateCO2Emissions(
  distanceKm: number,
  mode: TransportMode
): number {
  const factor = EMISSIONS_FACTORS[mode] || EMISSIONS_FACTORS['solo-car'];
  return distanceKm * factor;
}

/**
 * Calculate CO2 saved compared to solo car driving
 */
export function calculateCO2Saved(
  distanceKm: number,
  mode: TransportMode
): number {
  const soloEmissions = calculateCO2Emissions(distanceKm, 'solo-car');
  const actualEmissions = calculateCO2Emissions(distanceKm, mode);
  return soloEmissions - actualEmissions;
}

/**
 * Calculate CO2 saved for a carpool ride
 * Takes into account number of passengers
 */
export function calculateCarpoolCO2Saved(
  distanceKm: number,
  passengerCount: number
): number {
  // Solo car emissions
  const soloEmissions = calculateCO2Emissions(distanceKm, 'solo-car');
  
  // Carpool emissions (shared among passengers + driver)
  const totalPeople = passengerCount + 1; // passengers + driver
  const carpoolEmissionsPerPerson = calculateCO2Emissions(distanceKm, 'solo-car') / totalPeople;
  const totalCarpoolEmissions = carpoolEmissionsPerPerson * totalPeople;
  
  // Total saved = (solo emissions * number of passengers) - carpool emissions
  return soloEmissions * passengerCount - (totalCarpoolEmissions - soloEmissions);
}
