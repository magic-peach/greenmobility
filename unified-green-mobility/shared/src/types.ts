// Shared types between client and server

export type UserRole = 'driver' | 'passenger' | 'admin';
export type KYCStatus = 'unverified' | 'pending' | 'verified';
export type VehicleType = 'car' | 'bike' | 'scooter';
export type RideStatus = 'open' | 'ongoing' | 'completed' | 'cancelled';
export type PassengerStatus = 'requested' | 'accepted' | 'rejected' | 'completed';
export type ParkingSpotStatus = 'available' | 'occupied' | 'reserved' | 'out_of_service';
export type ReservationStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  kyc_status: KYCStatus;
  kyc_document_type?: string;
  kyc_document_number?: string;
  kyc_verified_at?: string;
  created_at: string;
}

export interface Ride {
  id: string;
  driver_id: string;
  start_location_name: string;
  start_lat: number;
  start_lng: number;
  end_location_name: string;
  end_lat: number;
  end_lng: number;
  departure_time: string;
  vehicle_type: VehicleType;
  total_seats: number;
  available_seats: number;
  estimated_fare?: number;
  status: RideStatus;
  created_at: string;
  driver?: User;
}

export interface RidePassenger {
  id: string;
  ride_id: string;
  passenger_id: string;
  pickup_location_name: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_location_name: string;
  drop_lat: number;
  drop_lng: number;
  distance_km: number;
  fare_share: number;
  status: PassengerStatus;
  passenger?: User;
}

export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  total_spots: number;
  created_at: string;
}

export interface ParkingSpot {
  id: string;
  parking_lot_id: string;
  spot_number: string;
  level?: number;
  is_ev_friendly: boolean;
  is_disabled_friendly: boolean;
  status: ParkingSpotStatus;
}

export interface ParkingReservation {
  id: string;
  user_id: string;
  parking_spot_id: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  amount_paid: number;
  created_at: string;
  parking_spot?: ParkingSpot;
  parking_lot?: ParkingLot;
}

export interface Rating {
  id: string;
  ride_id?: string;
  parking_reservation_id?: string;
  rater_id: string;
  rated_user_id: string;
  score: number;
  comment?: string;
  created_at: string;
}

export interface UserEmissionsStats {
  user_id: string;
  total_distance_km: number;
  total_co2_saved_kg: number;
}

export interface UserRewards {
  user_id: string;
  points: number;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
}

export interface SOSEvent {
  id: string;
  user_id: string;
  ride_id?: string;
  location_lat: number;
  location_lng: number;
  timestamp: string;
}

export interface RideLocation {
  ride_id: string;
  timestamp: string;
  lat: number;
  lng: number;
}

export interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: User;
}

