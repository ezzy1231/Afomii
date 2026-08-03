import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  async getPublicRestaurants(filters: {
    lat?: number;
    lng?: number;
    category?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { category: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const businesses = await this.prisma.businessProfile.findMany({
      where,
      include: {
        branches: {
          select: {
            id: true,
            branchName: true,
            address: true,
            latitude: true,
            longitude: true,
            phone: true,
            bookingConfig: {
              select: {
                bookingMode: true,
                totalTables: true,
                maxGuestPerTable: true,
              },
            },
            menuItems: {
              select: { id: true, name: true, price: true, category: true, isAvailable: true },
              take: 20,
            },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 50,
    });

    return businesses.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      logoUrl: b.logoUrl,
      coverUrl: b.coverUrl,
      isVerified: b.isVerified,
      openingHours: b.openingHours,
      branches: b.branches,
    }));
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
        events: {
          create: [],
        },
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
      payoutSettings?: {
        bankName?: string;
        accountNumber?: string;
        accountHolder?: string;
      };
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
}
