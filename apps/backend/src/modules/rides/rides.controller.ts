import { Controller, Post, Body } from "@nestjs/common";
import { RidesService } from "./rides.service";
import { RideEstimateSchema, RideDispatchSchema } from "@urbanexplore/shared";
import { Public } from "../../common/decorators";

@Controller("rides")
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Public()
  @Post("estimate")
  async getEstimates(@Body() body: unknown) {
    const dto = RideEstimateSchema.parse(body);
    return this.ridesService.getEstimates(dto);
  }

  @Public()
  @Post("dispatch-link")
  async getDispatchLink(@Body() body: unknown) {
    const dto = RideDispatchSchema.parse(body);
    return this.ridesService.generateDispatchLink(dto);
  }
}
