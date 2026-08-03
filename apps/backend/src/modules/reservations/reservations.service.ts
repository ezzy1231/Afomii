import {
  Injectable,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

@Injectable()
export class ReservationsService {
  private readonly lockPrefix = "reservation_lock:";

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService
  ) {}

  async checkAvailability(dto: {
    branchId: string;
    date: string;
    guestCount: number;
  }) {
    const branch = await this.prisma.businessBranch.findUnique({
      where: { id: dto.branchId },
      include: { bookingConfig: true },
    });

    if (!branch) throw new BadRequestException("Branch not found");
    if (!branch.bookingConfig)
      throw new BadRequestException("Booking config not configured");

    const config = branch.bookingConfig;
    const reservationDate = new Date(dto.date);
    const dayOfWeek = reservationDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    if (config.bookingMode === "WALK_IN_ONLY") {
      return {
        bookingMode: "WALK_IN_ONLY",
        message: "This restaurant only accepts walk-ins",
        available: false,
      };
    }

    if (dto.guestCount > config.maxGuestPerTable) {
      throw new BadRequestException(
        `Maximum guests per table is ${config.maxGuestPerTable}`
      );
    }

    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        branchId: dto.branchId,
        reservationDate: reservationDate,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    const availableTables = config.totalTables - existingReservations.length;

    return {
      bookingMode: config.bookingMode,
      availableTables: Math.max(0, availableTables),
      totalTables: config.totalTables,
      maxGuestPerTable: config.maxGuestPerTable,
      timeSlotDuration: config.timeSlotDurationMinutes,
      requirePrepayment: config.requirePrepayment,
      available: availableTables > 0,
    };
  }

  async createReservation(
    userId: string,
    dto: {
      branchId: string;
      reservationDate: string;
      timeSlot?: string;
      guestCount: number;
      specialRequests?: string;
    }
  ) {
    const lockKey = `${this.lockPrefix}${dto.branchId}_${dto.reservationDate}_${dto.timeSlot}`;
    const lockToken = await this.redisService.acquireLock(lockKey, 5000);

    if (!lockToken) {
      throw new ConflictException(
        "This time slot is being booked by another user. Please try again."
      );
    }

    try {
      const branch = await this.prisma.businessBranch.findUnique({
        where: { id: dto.branchId },
        include: { bookingConfig: true },
      });

      if (!branch?.bookingConfig) {
        throw new BadRequestException("Branch or booking config not found");
      }

      const reservationDate = new Date(dto.reservationDate);
      const existingCount = await this.prisma.reservation.count({
        where: {
          branchId: dto.branchId,
          reservationDate,
          timeSlot: dto.timeSlot,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

      if (existingCount >= branch.bookingConfig.totalTables) {
        throw new ConflictException("No tables available for this time slot");
      }

      const reservationCode = this.generateReservationCode();

      const status =
        branch.bookingConfig.bookingMode === "TIME_SLOT"
          ? "CONFIRMED"
          : "PENDING";

      return this.prisma.$transaction(async (tx) => {
        const reservation = await tx.reservation.create({
          data: {
            userId,
            branchId: dto.branchId,
            reservationDate,
            timeSlot: dto.timeSlot,
            guestCount: dto.guestCount,
            status,
            specialRequests: dto.specialRequests,
            reservationCode,
          },
        });

        return reservation;
      });
    } finally {
      await this.redisService.releaseLock(lockKey, lockToken);
    }
  }

  private generateReservationCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `FR-${code}`;
  }
}
