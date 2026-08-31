import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ReservationsService } from "./reservations.service";
import { CurrentUser, Public } from "../../common/decorators";
import { CheckAvailabilitySchema, CreateReservationSchema } from "@urbanexplore/shared";

@Controller("reservations")
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Public()
  @Post("check-availability")
  checkAvailability(@Body() body: unknown) {
    const dto = CheckAvailabilitySchema.parse(body);
    return this.reservationsService.checkAvailability(dto);
  }

  @Get("mine")
  getMine(
    @CurrentUser("sub") userId: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.reservationsService.getMine(userId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  create(
    @CurrentUser("sub") userId: string,
    @Body() body: unknown
  ) {
    const dto = CreateReservationSchema.parse(body);
    return this.reservationsService.createReservation(userId, dto);
  }

  @Patch(":id/cancel")
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    return this.reservationsService.cancel(userId, id);
  }
}
