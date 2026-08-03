import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
import * as crypto from "crypto";

@Injectable()
export class EventsService {
  private readonly holdPrefix = "ticket_hold:";
  private readonly lockPrefix = "ticket_lock:";

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService
  ) {}

  async holdTickets(
    userId: string,
    eventId: string,
    dto: { ticketTypeId: string; quantity: number }
  ) {
    const lockKey = `${this.lockPrefix}${dto.ticketTypeId}`;
    const lockToken = await this.redisService.acquireLock(lockKey, 3000);

    if (!lockToken) {
      throw new ConflictException("Inventory is locked. Please retry.");
    }

    try {
      const ticketType = await this.prisma.ticketType.findUnique({
        where: { id: dto.ticketTypeId },
      });

      if (!ticketType) throw new NotFoundException("Ticket type not found");

      if (ticketType.remainingQuantity < dto.quantity) {
        throw new BadRequestException(
          `Only ${ticketType.remainingQuantity} tickets remaining`
        );
      }

      const holdToken = crypto.randomBytes(32).toString("hex");
      const holdData = JSON.stringify({
        userId,
        eventId,
        ticketTypeId: dto.ticketTypeId,
        quantity: dto.quantity,
        price: ticketType.price,
      });

      await this.redisService.set(
        `${this.holdPrefix}${holdToken}`,
        holdData,
        600
      );

      await this.prisma.ticketType.update({
        where: { id: dto.ticketTypeId },
        data: { remainingQuantity: ticketType.remainingQuantity - dto.quantity },
      });

      return {
        holdToken,
        expiresInSeconds: 600,
        price: ticketType.price,
        totalPaid: ticketType.price * dto.quantity,
      };
    } finally {
      await this.redisService.releaseLock(lockKey, lockToken);
    }
  }

  async checkoutTickets(
    userId: string,
    eventId: string,
    dto: { holdToken: string; ticketTypeId: string; quantity: number }
  ) {
    const holdData = await this.redisService.get(
      `${this.holdPrefix}${dto.holdToken}`
    );

    if (!holdData) {
      throw new BadRequestException(
        "Hold expired or invalid. Please acquire a new hold."
      );
    }

    const hold = JSON.parse(holdData);

    if (hold.userId !== userId) {
      throw new BadRequestException("Hold token does not belong to this user");
    }

    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: dto.ticketTypeId },
    });

    if (!ticketType) throw new NotFoundException("Ticket type not found");

    const qrCodeHash = crypto
      .createHash("sha256")
      .update(`${userId}:${eventId}:${dto.ticketTypeId}:${Date.now()}`)
      .digest("hex");

    const purchase = await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.ticketPurchase.create({
        data: {
          userId,
          eventId,
          ticketTypeId: dto.ticketTypeId,
          quantity: dto.quantity,
          totalPaid: ticketType.price * dto.quantity,
          status: "COMPLETED",
          qrCodeHash,
          holdToken: dto.holdToken,
        },
      });

      return purchase;
    });

    await this.redisService.del(`${this.holdPrefix}${dto.holdToken}`);

    return purchase;
  }

  async handleExpiredHolds(): Promise<number> {
    let restored = 0;
    const keys = await this.redisService.listKeys(`${this.holdPrefix}*`);

    for (const key of keys) {
      const ttl = await this.redisService.ttl(key);
      if (ttl <= 0) {
        const holdData = await this.redisService.peek(key);
        if (holdData) {
          const hold = JSON.parse(holdData);
          await this.prisma.ticketType.update({
            where: { id: hold.ticketTypeId },
            data: { remainingQuantity: { increment: hold.quantity } },
          });
          await this.redisService.del(key);
          restored += hold.quantity;
        }
      }
    }

    return restored;
  }

  async getPublicEvents(filters: {
    category?: string;
    search?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { venueName: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        ticketTypes: {
          select: {
            id: true,
            name: true,
            tier: true,
            price: true,
            totalQuantity: true,
            remainingQuantity: true,
          },
        },
        organizer: {
          select: { id: true, email: true },
        },
      },
      orderBy: { startDateTime: "asc" },
      take: 50,
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      venueName: event.venueName,
      latitude: event.latitude,
      longitude: event.longitude,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      coverImageUrl: event.coverImageUrl,
      status: event.status,
      ticketTypes: event.ticketTypes,
      organizerId: event.organizerId,
    }));
  }

  async getEventDetail(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketTypes: {
          select: {
            id: true,
            name: true,
            tier: true,
            price: true,
            totalQuantity: true,
            remainingQuantity: true,
            salesStart: true,
            salesEnd: true,
          },
        },
        organizer: {
          select: { id: true, email: true },
        },
      },
    });

    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  async createEvent(
    organizerId: string,
    dto: {
      title: string;
      description?: string;
      category: string;
      venueName: string;
      latitude?: number;
      longitude?: number;
      startDateTime: string;
      endDateTime: string;
      coverImageUrl?: string;
    }
  ) {
    return this.prisma.event.create({
      data: {
        organizerId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        venueName: dto.venueName,
        startDateTime: new Date(dto.startDateTime),
        endDateTime: new Date(dto.endDateTime),
        coverImageUrl: dto.coverImageUrl,
        status: "DRAFT",
      },
    });
  }

  async createTicketType(
    eventId: string,
    dto: {
      name: string;
      tier: string;
      price: number;
      totalQuantity: number;
      salesStart?: string;
      salesEnd?: string;
    }
  ) {
    return this.prisma.ticketType.create({
      data: {
        eventId,
        name: dto.name,
        tier: dto.tier as any,
        price: dto.price,
        totalQuantity: dto.totalQuantity,
        remainingQuantity: dto.totalQuantity,
        salesStart: dto.salesStart ? new Date(dto.salesStart) : null,
        salesEnd: dto.salesEnd ? new Date(dto.salesEnd) : null,
      },
    });
  }
}
