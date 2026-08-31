import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
import { BookingMode } from "@prisma/client";

@Injectable()
export class ReservationsService {
  private readonly lockPrefix = "reservation_lock:";

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService
  ) {}

  // ─── BE-1.1: GET /reservations/mine ──────────────────────────────
  async getMine(
    userId: string,
    opts: { status?: string; page?: number; limit?: number } = {}
  ) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
    const where: any = { userId };
    if (opts.status) where.status = opts.status;

    const [total, rows] = await Promise.all([
      this.prisma.reservation.count({ where }),
      this.prisma.reservation.findMany({
        where,
        orderBy: { reservationDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: {
            include: {
              business: { select: { id: true, name: true, coverUrl: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: rows.map((r) => ({
        id: r.id,
        reservationCode: r.reservationCode,
        status: r.status,
        guestCount: r.guestCount,
        reservationDate: r.reservationDate,
        timeSlot: r.timeSlot,
        specialRequests: r.specialRequests,
        createdAt: r.createdAt,
        branch: {
          id: r.branch.id,
          branchName: r.branch.branchName,
          address: r.branch.address,
          business: r.branch.business,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── BE-1.2: PATCH /reservations/:id/cancel ──────────────────────
  async cancel(userId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundException("Reservation not found");
    if (reservation.userId !== userId)
      throw new ForbiddenException("You can only cancel your own reservations");

    if (["CANCELLED", "COMPLETED", "REJECTED"].includes(reservation.status)) {
      throw new ConflictException(
        reservation.status === "CANCELLED"
          ? "Reservation is already cancelled"
          : `Reservations in '${reservation.status}' state cannot be cancelled`
      );
    }

    if (reservation.reservationDate < new Date()) {
      throw new ConflictException(
        "Reservations in the past cannot be cancelled"
      );
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: "CANCELLED" },
      include: { branch: { include: { business: true } } },
    });
  }

  // ─── BE-1.3: per-slot availability ───────────────────────────────
  async checkAvailability(dto: {
    branchId: string;
    date: string;
    guestCount: number;
  }) {
    const branch = await this.prisma.businessBranch.findUnique({
      where: { id: dto.branchId },
      include: { bookingConfig: true, business: { select: { openingHours: true } } },
    });

    if (!branch) throw new NotFoundException("Branch not found");
    if (!branch.bookingConfig)
      throw new BadRequestException("Booking config not configured");

    const config = branch.bookingConfig;
    const reservationDate = new Date(dto.date);
    const dayKey = reservationDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    if (config.bookingMode === "WALK_IN_ONLY") {
      return {
        bookingMode: "WALK_IN_ONLY",
        message: "This restaurant only accepts walk-ins",
        date: dto.date,
        available: false,
        slots: [],
      };
    }

    if (dto.guestCount > config.maxGuestPerTable) {
      throw new BadRequestException(
        `Maximum guests per table is ${config.maxGuestPerTable}`
      );
    }

    const startOfDay = new Date(dto.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const booked = await this.prisma.reservation.groupBy({
      by: ["timeSlot"],
      where: {
        branchId: dto.branchId,
        reservationDate: { gte: startOfDay, lt: endOfDay },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      _count: { id: true },
    });
    const bookedBySlot = new Map(booked.map((b) => [b.timeSlot, b._count.id]));

    const hours = (branch.business as any)?.openingHours || {};
    const daySlots = hours[dayKey] || [];
    const slots = daySlots.flatMap((range: { open: string; close: string }) => {
      const out: { time: string; available: boolean }[] = [];
      let t = this.parseTime(range.open);
      const close = this.parseTime(range.close);
      const dur = config.timeSlotDurationMinutes || 60;
      // guard against infinite loop
      let guard = 0;
      while (t + dur <= close && guard < 96) {
        out.push({
          time: this.formatTime(t),
          available: (bookedBySlot.get(this.formatTime(t)) ?? 0) < config.totalTables,
        });
        t += dur;
        guard++;
      }
      return out;
    });

    return {
      bookingMode: config.bookingMode,
      date: dto.date,
      timeSlotDurationMinutes: config.timeSlotDurationMinutes,
      maxGuestPerTable: config.maxGuestPerTable,
      requirePrepayment: config.requirePrepayment,
      available: (slots as { time: string; available: boolean }[]).some((sl) => sl.available),
      slots,
    };
  }

  // ─── BE-1.4: create-path correctness ─────────────────────────────
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

      if (!branch) throw new NotFoundException("Branch not found");
      if (!branch.bookingConfig)
        throw new BadRequestException("Branch or booking config not found");

      const config = branch.bookingConfig;

      if (config.bookingMode === "WALK_IN_ONLY") {
        throw new BadRequestException(
          "This restaurant only accepts walk-ins"
        );
      }

      if (dto.guestCount > config.maxGuestPerTable) {
        throw new BadRequestException(
          `Maximum guests per table is ${config.maxGuestPerTable}`
        );
      }

      const reservationDate = new Date(dto.reservationDate);

      if (config.bookingMode === "TIME_SLOT" && !dto.timeSlot) {
        throw new BadRequestException("timeSlot is required for time-slot bookings");
      }

      const existingCount = await this.prisma.reservation.count({
        where: {
          branchId: dto.branchId,
          reservationDate,
          timeSlot: dto.timeSlot,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

      if (existingCount >= config.totalTables) {
        throw new ConflictException("No tables available for this time slot");
      }

      const reservationCode = this.generateReservationCode();

      // REQUEST_BASED always starts PENDING; TIME_SLOT confirms immediately
      const status =
        config.bookingMode === "TIME_SLOT" ? "CONFIRMED" : "PENDING";

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

  private parseTime(t: string): number {
    let [h, m] = t.split(":").map((n) => parseInt(n, 10));
    if (h === 0 && m === 0) h = 24; // "00:00" = midnight end-of-day
    return h * 60 + (m || 0);
  }

  private formatTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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