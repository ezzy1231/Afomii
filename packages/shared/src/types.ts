export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type TokenPayload = {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
};

export type RideOption = {
  providerName: string;
  providerLogo: string;
  tier: Economy | Comfort | VIP | BikeMoto;
  estimatedPrice: {
    amount: number;
    currency: string;
  };
  currencySymbol: string;
  etaMinutes: number;
  badge: Fastest | BestValue | LocalFavorite | null;
};

type Economy = "Economy";
type Comfort = "Comfort";
type VIP = "VIP";
type BikeMoto = "Bike/Moto";
type Fastest = "Fastest";
type BestValue = "Best Value";
type LocalFavorite = "Local Favorite";

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type OpeningHours = Record<
  string,
  { open: string; close: string }[]
>;

export type DietaryRestriction =
  | "Vegan"
  | "Halal"
  | "Kosher"
  | "Keto"
  | "Diabetic-friendly";

export type Allergy =
  | "Peanuts"
  | "Dairy"
  | "Gluten"
  | "Seafood"
  | "Soy"
  | "Eggs";
