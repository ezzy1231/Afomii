import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "../../common/decorators";
import {
  SignupSchema,
  LoginSchema,
  RefreshTokenSchema,
} from "@urbanexplore/shared";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("signup")
  async signup(@Body() body: unknown) {
    const dto = SignupSchema.parse(body);
    return this.authService.signup(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown) {
    const dto = LoginSchema.parse(body);
    return this.authService.login(dto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: unknown) {
    const { refreshToken } = RefreshTokenSchema.parse(body);
    return this.authService.refresh(refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: unknown) {
    const { refreshToken } = RefreshTokenSchema.parse(body);
    await this.authService.logout(refreshToken);
    return { message: "Logged out successfully" };
  }
}
