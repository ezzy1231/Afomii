import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "../../common/decorators";
import {
  SignupSchema,
  LoginSchema,
  RefreshTokenSchema,
} from "@urbanexplore/shared";
import type { ZodTypeAny } from "zod";

/**
 * BE-0.2 slice: schemas parsed at the edge with a stable 400 envelope.
 * (Global ZodValidationPipe unifies the remaining controllers later.)
 */
function parseOrThrow<T extends ZodTypeAny>(schema: T, body: unknown): T["_output"] {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new BadRequestException({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: first ? `${first.path.join(".") || "body"}: ${first.message}` : "Invalid payload",
      issues: result.error.issues,
    });
  }
  return result.data;
}

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("signup")
  async signup(@Body() body: unknown) {
    const dto = parseOrThrow(SignupSchema, body);
    return this.authService.signup(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown) {
    const dto = parseOrThrow(LoginSchema, body);
    return this.authService.login(dto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: unknown) {
    const { refreshToken } = parseOrThrow(RefreshTokenSchema, body);
    return this.authService.refresh(refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: unknown) {
    const { refreshToken } = parseOrThrow(RefreshTokenSchema, body);
    await this.authService.logout(refreshToken);
    return { message: "Logged out successfully" };
  }
}
