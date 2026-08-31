import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  // ─── BE-2.2/2.3: List with geo ordering, filters, pagination ─────
  async getPublicRestaurants(filters: {
    lat?: number;
    lng?: number;
    category?: string;
    search?: string;
    openNow?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.category) {
      where.category = { contains: filters.category, mode: "insensitive" };
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { category: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [total, businesses] = await Promise.all([
      this.prisma.businessProfile.count({ where }),
      this.prisma.businessProfile.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const bizIds = businesses.map((b) => b.id);
    const branches = bizIds.length
      ? await this.prisma.businessBranch.findMany({
          where: { businessId: { in: bizIds } },
          include: { bookingConfig: true },
        })
      : [];

    const branchMap = new Map<string, typeof branches>();
    for (const br of branches) {
      if (!branchMap.has(br.businessId)) branchMap.set(br.businessId, []);
      branchMap.get(br.businessId)!.push(br);
    }

    const now = new Date();
    const dayKey = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const serverMinutes = now.getHours() * 60 + now.getMinutes();

    const data = businesses.map((b) => {
      const bizBranches = branchMap.get(b.id) || [];
      const openingHours = (b.openingHours as any) ?? {};

      const enrichedBranches = bizBranches.map((br) => {
        let distanceKm: number | undefined;
        if (filters.lat != null && filters.lng != null && br.latitude != null && br.longitude != null) {
          distanceKm = this.haversineKm(filters.lat, filters.lng, br.latitude, br.longitude);
        }

        let isOpenNow = false;
        const dayHours: { open: string; close: string }[] = openingHours[dayKey] || [];
        for (const range of dayHours) {
          const openMin = this.parseTime(range.open);
          const closeMin = this.parseTime(range.close);
          if (openMin <= serverMinutes && serverMinutes <= closeMin) {
            isOpenNow = true;
            break;
          }
        }

        return {
          id: br.id,
          branchName: br.branchName,
          address: br.address,
          latitude: br.latitude,
          longitude: br.longitude,
          phone: br.phone,
          distanceKm: distanceKm != null ? Math.round(distanceKm * 10) / 10 : undefined,
          bookingMode: br.bookingConfig?.bookingMode ?? "TIME_SLOT",
          acceptsBookings: br.bookingConfig?.bookingMode !== "WALK_IN_ONLY",
          isOpenNow,
        };
      });

      return {
        id: b.id,
        name: b.name,
        category: b.category,
        logoUrl: b.logoUrl,
        coverUrl: b.coverUrl,
        isVerified: b.isVerified,
        openingHours,
        branches: enrichedBranches,
      };
    });

    const filtered = filters.openNow === "true"
      ? data.filter((b) => b.branches.some((br) => br.isOpenNow))
      : data;

    if (filters.lat != null && filters.lng != null) {
      filtered.sort((a, b) => {
        const aMin = Math.min(...a.branches.map((br) => br.distanceKm ?? Number.MAX_VALUE));
        const bMin = Math.min(...b.branches.map((br) => br.distanceKm ?? Number.MAX_VALUE));
        return aMin - bMin;
      });
    }

    return {
      data: filtered,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── BE-2.1: Restaurant detail ───────────────────────────────────
  async getRestaurantById(businessId: string) {
    const business = await this.prisma.businessProfile.findUnique({
      where: { id: businessId },
      include: {
        branches: {
          include: {
            bookingConfig: true,
            menuItems: { orderBy: { category: "asc" } },
          },
        },
      },
    });

    if (!business) throw new NotFoundException("Restaurant not found");

    const menuByCategory: Record<string, any[]> = {};
    for (const branch of business.branches) {
      for (const item of branch.menuItems) {
        const cat = item.category || "Uncategorized";
        if (!menuByCategory[cat]) menuByCategory[cat] = [];
        if (!menuByCategory[cat].some((m: any) => m.id === item.id)) {
          menuByCategory[cat].push(item);
        }
      }
    }

    return {
      id: business.id,
      name: business.name,
      category: business.category,
      logoUrl: business.logoUrl,
      coverUrl: business.coverUrl,
      isVerified: business.isVerified,
      openingHours: business.openingHours,
      menuByCategory,
      branches: business.branches.map((br) => ({
        id: br.id,
        branchName: br.branchName,
        address: br.address,
        latitude: br.latitude,
        longitude: br.longitude,
        phone: br.phone,
        bookingConfig: br.bookingConfig
          ? {
              id: br.bookingConfig.id,
              bookingMode: br.bookingConfig.bookingMode,
              timeSlotDurationMinutes: br.bookingConfig.timeSlotDurationMinutes,
              totalTables: br.bookingConfig.totalTables,
              maxGuestPerTable: br.bookingConfig.maxGuestPerTable,
              requirePrepayment: br.bookingConfig.requirePrepayment,
              prepaymentType: br.bookingConfig.prepaymentType,
              prepaymentValue: br.bookingConfig.prepaymentValue,
              cancellationPolicyText: br.bookingConfig.cancellationPolicyText,
            }
          : null,
        menuItems: br.menuItems.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          category: m.category,
          imageUrl: m.imageUrl,
          isAvailable: m.isAvailable,
        })),
      })),
    };
  }

  async registerBusiness(
    userId: string,
    dto: {
      name: string;
      category: string;
      ownerName: string;
      businessEmail: string;
      businessPhone: string;
      licenseUrl?: string;
      logoUrl?: string;
      coverUrl?: string;
    }
  ) {
    return this.prisma.businessProfile.create({
      data: {
        name: dto.name,
        category: dto.category,
        licenseUrl: dto.licenseUrl,
        logoUrl: dto.logoUrl,
        coverUrl: dto.coverUrl,
      },
    });
  }

  async addBranch(
    businessId: string,
    dto: {
      branchName: string;
      address: string;
      latitude: number;
      longitude: number;
      phone?: string;
      openingHours?: Record<string, { open: string; close: string }[]>;
    }
  ) {
    const business = await this.prisma.businessProfile.findUnique({
      where: { id: businessId },
    });
    if (!business) throw new NotFoundException("Business not found");

    return this.prisma.businessBranch.create({
      data: {
        businessId,
        branchName: dto.branchName,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        phone: dto.phone,
      },
    });
  }

  async registerOrganizer(
    userId: string,
    dto: {
      businessName: string;
      businessEmail: string;
      businessPhone: string;
      verificationDocs?: string[];
      payoutSettings?: { bankName?: string; accountNumber?: string; accountHolder?: string };
    }
  ) {
    return this.prisma.businessProfile.create({
      data: {
        name: dto.businessName,
        category: "Event Organizer",
        licenseUrl: dto.verificationDocs?.[0],
      },
    });
  }

  async getBusinessDashboard(businessId: string) {
    const business = await this.prisma.businessProfile.findUnique({
      where: { id: businessId },
      include: {
        branches: {
          include: {
            reservations: true,
            bookingConfig: true,
            menuItems: true,
          },
        },
      },
    });
    if (!business) throw new NotFoundException("Business not found");
    return business;
  }

  async getReservations(branchId: string) {
    return this.prisma.reservation.findMany({
      where: { branchId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true, phone: true } } },
    });
  }

  async updateReservationStatus(
    reservationId: string,
    dto: { status: string; proposedDateTime?: string }
  ) {
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: dto.status as any,
        timeSlot: dto.proposedDateTime ?? undefined,
      },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────
  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private parseTime(t: string): number {
    const parts = t.split(":");
    const h = parseInt(parts[0], 10);
    const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    return h * 60 + m;
  }
}