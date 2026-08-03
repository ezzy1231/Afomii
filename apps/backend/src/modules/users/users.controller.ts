import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CurrentUser } from "../../common/decorators";
import { UpdateProfileSchema, SavePreferencesSchema } from "@urbanexplore/shared";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("profile")
  getProfile(@CurrentUser("sub") userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch("profile")
  updateProfile(@CurrentUser("sub") userId: string, @Body() body: unknown) {
    const dto = UpdateProfileSchema.parse(body);
    return this.usersService.updateProfile(userId, dto);
  }

  @Post("preferences")
  savePreferences(@CurrentUser("sub") userId: string, @Body() body: unknown) {
    const dto = SavePreferencesSchema.parse(body);
    return this.usersService.savePreferences(userId, dto);
  }
}
