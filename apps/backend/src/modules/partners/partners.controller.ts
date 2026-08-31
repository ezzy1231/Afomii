import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { PartnersService } from "./partners.service";
import { Roles, CurrentUser, Public } from "../../common/decorators";
import {
  BusinessRegisterSchema,
  BranchRegisterSchema,
  OrganizerRegisterSchema,
  UpdateReservationStatusSchema,
} from "@urbanexplore/shared";

@Controller("partners")
export class PartnersController {
  constructor(private partnersService: PartnersService) {}

  @Public()
  @Get("restaurants")
  getPublicRestaurants(
    @Query("lat") lat?: string,
    @Query("lng") lng?: string,
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("openNow") openNow?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.partnersService.getPublicRestaurants({
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      category,
      search,
      openNow,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Public()
  @Get("restaurants/:businessId")
  getRestaurantDetail(@Param("businessId") businessId: string) {
    return this.partnersService.getRestaurantById(businessId);
  }

  @Post("business/register")
  @Roles("RESTAURANT_ADMIN")
  registerBusiness(@CurrentUser("sub") userId: string, @Body() body: unknown) {
    const dto = BusinessRegisterSchema.parse(body);
    return this.partnersService.registerBusiness(userId, dto);
  }

  @Post("business/branches")
  @Roles("RESTAURANT_ADMIN")
  addBranch(@Body() body: unknown) {
    const dto = BranchRegisterSchema.parse(body);
    return this.partnersService.addBranch(dto.businessId, dto);
  }

  @Post("organizer/register")
  @Roles("EVENT_ORGANIZER")
  registerOrganizer(@CurrentUser("sub") userId: string, @Body() body: unknown) {
    const dto = OrganizerRegisterSchema.parse(body);
    return this.partnersService.registerOrganizer(userId, dto);
  }

  @Get("business/:id/dashboard")
  @Roles("RESTAURANT_ADMIN", "EVENT_ORGANIZER")
  getDashboard(@Param("id") businessId: string) {
    return this.partnersService.getBusinessDashboard(businessId);
  }

  @Get("branches/:branchId/reservations")
  @Roles("RESTAURANT_ADMIN")
  getReservations(@Param("branchId") branchId: string) {
    return this.partnersService.getReservations(branchId);
  }

  @Patch("reservations/:id/status")
  @Roles("RESTAURANT_ADMIN")
  updateReservationStatus(
    @Param("id") reservationId: string,
    @Body() body: unknown
  ) {
    const dto = UpdateReservationStatusSchema.parse(body);
    return this.partnersService.updateReservationStatus(reservationId, dto);
  }
}
