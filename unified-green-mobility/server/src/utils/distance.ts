/**
 * Google Maps Directions API integration for distance and ETA calculation
 */
import { config } from '../config/env';

export interface DirectionsResponse {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  polyline?: string;
}

export interface ETAResult {
  distanceKm: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  eta: Date;
  polyline?: string;
}

/**
 * Get distance and ETA using Google Directions API
 */
export async function getDistanceAndETA(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<ETAResult | null> {
  if (!config.googleMapsApiKey) {
    console.warn('Google Maps API key not configured, using Haversine distance');
    // Fallback to Haversine distance calculation
    const distanceKm = haversineDistance(originLat, originLng, destLat, destLng);
    // Estimate 50 km/h average speed
    const durationSeconds = (distanceKm / 50) * 3600;
    return {
      distanceKm,
      distanceText: `${distanceKm.toFixed(1)} km`,
      durationSeconds,
      durationText: formatDuration(durationSeconds),
      eta: new Date(Date.now() + durationSeconds * 1000),
    };
  }

  try {
    const origin = `${originLat},${originLng}`;
    const destination = `${destLat},${destLng}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${config.googleMapsApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      console.error('Google Directions API error:', data.status);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    const distanceKm = leg.distance.value / 1000; // Convert meters to km
    const durationSeconds = leg.duration.value;

    return {
      distanceKm,
      distanceText: leg.distance.text,
      durationSeconds,
      durationText: leg.duration.text,
      eta: new Date(Date.now() + durationSeconds * 1000),
      polyline: route.overview_polyline?.points,
    };
  } catch (error) {
    console.error('Error calling Google Directions API:', error);
    return null;
  }
}

/**
 * Calculate distance using Haversine formula (fallback)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

