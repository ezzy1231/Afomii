import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
import {
  RideProviderAdapter,
  RideOption,
  MockProviderAdapter,
} from "./adapters";

@Injectable()
export class RidesService {
  private readonly cachePrefix = "ride_estimate:";
  private readonly cacheTtl = 45;
  private providers: RideProviderAdapter[];

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private configService: ConfigService
  ) {
    this.providers = [new MockProviderAdapter()];
  }

  async getEstimates(dto: {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
  }) {
    const cacheKey = this.buildCacheKey(dto);

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      await this.logSearch(dto, parsed.estimates, null);
      return parsed;
    }

    const pickup = { lat: dto.pickupLat, lng: dto.pickupLng };
    const dropoff = { lat: dto.dropoffLat, lng: dto.dropoffLng };

    const results = await Promise.allSettled(
      this.providers.map((provider) =>
        this.executeWithTimeout(
          provider.getEstimates(pickup, dropoff),
          2000
        )
      )
    );

    const allOptions: RideOption[] = [];
    const providerBadges = this.assignBadges(results);

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const options = result.value.map((opt) => ({
          ...opt,
          badge: providerBadges.get(opt.providerName) ?? null,
        }));
        allOptions.push(...options);
      }
    });

    allOptions.sort((a, b) => a.estimatedPrice.amount - b.estimatedPrice.amount);

    const response = {
      pickup: { lat: dto.pickupLat, lng: dto.pickupLng },
      dropoff: { lat: dto.dropoffLat, lng: dto.dropoffLng },
      estimates: allOptions,
      fetchedAt: new Date().toISOString(),
    };

    await this.redisService.set(cacheKey, JSON.stringify(response), this.cacheTtl);
    await this.logSearch(dto, allOptions, null);

    return response;
  }

  async generateDispatchLink(dto: {
    providerName: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
  }) {
    const pickup = `${dto.pickupLat},${dto.pickupLng}`;
    const dropoff = `${dto.dropoffLat},${dto.dropoffLng}`;

    const schemes: Record<string, string> = {
      uber: `uber://?action=setPickup&pickup[latitude]=${dto.pickupLat}&pickup[longitude]=${dto.pickupLng}&dropoff[latitude]=${dto.dropoffLat}&dropoff[longitude]=${dto.dropoffLng}`,
      yango: `yango://route?start=${pickup}&end=${dropoff}`,
      lyft: `lyft://ridetype?id=lyft&pickup[latitude]=${dto.pickupLat}&pickup[longitude]=${dto.pickupLng}&destination[latitude]=${dto.dropoffLat}&destination[longitude]=${dto.dropoffLng}`,
      feres: `feres://navigate?start=${pickup}&end=${dropoff}`,
    };

    const key = dto.providerName.toLowerCase().split(" ")[0];
    const deepLink = schemes[key];

    if (!deepLink) {
      const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${pickup}&destination=${dropoff}`;
      return { providerName: dto.providerName, deepLink, webFallback: webUrl };
    }

    return { providerName: dto.providerName, deepLink };
  }

  private buildCacheKey(dto: {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
  }): string {
    const round = (n: number) => Math.round(n * 1000) / 1000;
    return `${this.cachePrefix}${round(dto.pickupLat)}_${round(dto.pickupLng)}_${round(dto.dropoffLat)}_${round(dto.dropoffLng)}`;
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    ms: number
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Provider timeout")), ms)
    );
    return Promise.race([promise, timeout]);
  }

  private assignBadges(
    results: PromiseSettledResult<RideOption[]>[]
  ): Map<string, string> {
    const allOptions: RideOption[] = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        allOptions.push(...result.value);
      }
    });

    const badges = new Map<string, string>();

    if (allOptions.length === 0) return badges;

    const fastest = allOptions.reduce((a, b) =>
      a.etaMinutes < b.etaMinutes ? a : b
    );
    badges.set(fastest.providerName, "Fastest");

    const cheapest = allOptions.reduce((a, b) =>
      a.estimatedPrice.amount < b.estimatedPrice.amount ? a : b
    );
    if (cheapest.providerName !== fastest.providerName) {
      badges.set(cheapest.providerName, "Best Value");
    } else {
      badges.set(cheapest.providerName, "Fastest & Best Value");
    }

    return badges;
  }

  private async logSearch(
    dto: {
      pickupLat: number;
      pickupLng: number;
      dropoffLat: number;
      dropoffLng: number;
    },
    estimates: RideOption[],
    selectedPartner: string | null
  ) {
    try {
      await this.prisma.rideSearchLog.create({
        data: {
          userId: "00000000-0000-0000-0000-000000000000",
          pickupLat: dto.pickupLat,
          pickupLng: dto.pickupLng,
          dropoffLat: dto.dropoffLat,
          dropoffLng: dto.dropoffLng,
          estimates: JSON.parse(JSON.stringify(estimates)),
          selectedPartner,
        },
      });
    } catch {
      // Log silently - analytics should not break the flow
    }
  }
}
