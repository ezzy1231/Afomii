export interface RideOption {
  providerName: string;
  providerLogo: string;
  tier: string;
  estimatedPrice: {
    amount: number;
    currency: string;
  };
  currencySymbol: string;
  etaMinutes: number;
  badge: string | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RideProviderAdapter {
  readonly providerName: string;
  getEstimates(pickup: GeoPoint, dropoff: GeoPoint): Promise<RideOption[]>;
}
