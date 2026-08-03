import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { EventsService } from "./events.service";
import { Roles, CurrentUser, Public } from "../../common/decorators";
import { HoldTicketSchema, CheckoutTicketsSchema } from "@urbanexplore/shared";

@Controller("events")
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Public()
  @Get()
  getPublicEvents(
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    return this.eventsService.getPublicEvents({
      category,
      search,
      status: status ?? "PUBLISHED",
    });
  }

  @Public()
  @Get(":eventId")
  getEventDetail(@Param("eventId") eventId: string) {
    return this.eventsService.getEventDetail(eventId);
  }

  @Post()
  @Roles("EVENT_ORGANIZER")
  createEvent(
    @CurrentUser("sub") userId: string,
    @Body() body: any
  ) {
    return this.eventsService.createEvent(userId, body);
  }

  @Post(":eventId/ticket-types")
  @Roles("EVENT_ORGANIZER")
  createTicketType(@Param("eventId") eventId: string, @Body() body: any) {
    return this.eventsService.createTicketType(eventId, body);
  }

  @Post(":eventId/tickets/hold")
  holdTickets(
    @CurrentUser("sub") userId: string,
    @Param("eventId") eventId: string,
    @Body() body: unknown
  ) {
    const dto = HoldTicketSchema.parse(body);
    return this.eventsService.holdTickets(userId, eventId, dto);
  }

  @Post(":eventId/tickets/checkout")
  checkoutTickets(
    @CurrentUser("sub") userId: string,
    @Param("eventId") eventId: string,
    @Body() body: unknown
  ) {
    const dto = CheckoutTicketsSchema.parse(body);
    return this.eventsService.checkoutTickets(userId, eventId, dto);
  }

  @Post("webhooks/tickets/hold-expired")
  async handleExpiredHolds() {
    const restored = await this.eventsService.handleExpiredHolds();
    return { restoredTickets: restored };
  }
}
