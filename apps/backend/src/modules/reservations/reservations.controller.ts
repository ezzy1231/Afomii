import { Controller, Post, Body } from "@nestjs/common";
import { ReservationsService } from "./reservations.service";
import { CurrentUser } from "../../common/decorators";
import { CheckAvailabilitySchema, CreateReservationSchema } from "@urbanexplore/shared";

@Controller("reservations")
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Post("check-availability")
  checkAvailability(@Body() body: unknown) {
    const dto = CheckAvailabilitySchema.parse(body);
    return this.reservationsService.checkAvailability(dto);
  }

  @Post()
  create(
    @CurrentUser("sub") userId: string,
    @Body() body: unknown
  ) {
    const dto = CreateReservationSchema.parse(body);
    return this.reservationsService.createReservation(userId, dto);
  }
}
