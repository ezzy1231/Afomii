import { RideProviderAdapter, RideOption, GeoPoint } from "./ride-provider.interface";

export class MockProviderAdapter implements RideProviderAdapter {
  readonly providerName = "MockRide";

  async getEstimates(
    pickup: GeoPoint,
    dropoff: GeoPoint
  ): Promise<RideOption[]> {
    const distance = this.haversineDistance(pickup, dropoff);
    const baseFare = distance * 0.5;

    await this.delay(100);

    return [
      {
        providerName: "MockRide",
        providerLogo: "https://via.placeholder.com/40",
        tier: "Economy",
        estimatedPrice: {
          amount: Math.round(baseFare * 10) / 10,
          currency: "USD",
        },
        currencySymbol: "$",
        etaMinutes: Math.round(distance * 2 + 3),
        badge: "Best Value",
      },
      {
        providerName: "MockRide",
        providerLogo: "https://via.placeholder.com/40",
        tier: "Comfort",
        estimatedPrice: {
          amount: Math.round(baseFare * 15) / 10,
          currency: "USD",
        },
        currencySymbol: "$",
        etaMinutes: Math.round(distance * 1.5 + 5),
        badge: null,
      },
      {
        providerName: "MockRide",
        providerLogo: "https://via.placeholder.com/40",
        tier: "VIP",
        estimatedPrice: {
          amount: Math.round(baseFare * 25) / 10,
          currency: "USD",
        },
        currencySymbol: "$",
        etaMinutes: Math.round(distance * 1.2 + 2),
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
