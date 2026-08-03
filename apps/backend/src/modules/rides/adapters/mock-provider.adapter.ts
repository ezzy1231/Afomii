import { RideProviderAdapter, RideOption, GeoPoint } from "./ride-provider.interface";

export class MockProviderAdapter implements RideProviderAdapter {
  readonly providerName = "Meter Taxi";

  async getEstimates(
    pickup: GeoPoint,
    dropoff: GeoPoint
  ): Promise<RideOption[]> {
    const distance = this.haversineDistance(pickup, dropoff);
    const normalizedDistance = Math.max(distance, 0.5);

    await this.delay(100);

    return [
      {
        providerName: "Meter Taxi",
        providerLogo: "https://via.placeholder.com/40",
        tier: "Standard",
        estimatedPrice: {
          amount: Math.round(90 + normalizedDistance * 18),
          currency: "ETB",
        },
        currencySymbol: "ETB",
        etaMinutes: Math.max(5, Math.round(normalizedDistance * 3 + 4)),
        badge: "Best Value",
      },
      {
        providerName: "Meter Taxi",
        providerLogo: "https://via.placeholder.com/40",
        tier: "Comfort",
        estimatedPrice: {
          amount: Math.round(110 + normalizedDistance * 22),
          currency: "ETB",
        },
        currencySymbol: "ETB",
        etaMinutes: Math.max(4, Math.round(normalizedDistance * 2.5 + 4)),
        badge: null,
      },
      {
        providerName: "Meter Taxi",
        providerLogo: "https://via.placeholder.com/40",
        tier: "Minivan",
        estimatedPrice: {
          amount: Math.round(140 + normalizedDistance * 28),
          currency: "ETB",
        },
        currencySymbol: "ETB",
        etaMinutes: Math.max(4, Math.round(normalizedDistance * 2.2 + 3)),
        badge: "Fastest",
      },
    ];
  }

  private haversineDistance(a: GeoPoint, b: GeoPoint): number {
    const R = 6371;
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const aVal =
      sinDLat * sinDLat +
      Math.cos(this.toRad(a.lat)) *
        Math.cos(this.toRad(b.lat)) *
        sinDLng *
        sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
