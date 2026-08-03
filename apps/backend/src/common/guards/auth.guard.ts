import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthGuard {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    // Try NestJS JWT first
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      });
      request["user"] = payload;
      return true;
    } catch {
      // Not a NestJS JWT — try Supabase JWT
    }

    // Try Supabase JWT
    const supabaseSecret = this.configService.get<string>("SUPABASE_JWT_SECRET");
    if (supabaseSecret) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: supabaseSecret,
        });

        // Supabase JWT has `email` and `sub` (Supabase UUID)
        // Find or create local user mapped to this Supabase identity
        const user = await this.findOrCreateSupabaseUser(payload);
        request["user"] = { sub: user.id, role: user.role, email: user.email };
        return true;
      } catch {
        // Not a valid Supabase JWT either
      }
    }

    throw new UnauthorizedException("Invalid or expired access token");
  }

  private async findOrCreateSupabaseUser(supabasePayload: {
    sub: string;
    email?: string;
    user_metadata?: Record<string, any>;
    app_metadata?: Record<string, any>;
  }) {
    const email = supabasePayload.email;

    // Try to find existing user by email
    if (email) {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) return existing;
    }

    // Map Supabase role from app_metadata or user_metadata
    const supabaseRole =
      supabasePayload.app_metadata?.role ??
      supabasePayload.user_metadata?.role ??
      "CUSTOMER";

    const roleMap: Record<string, string> = {
      admin: "SYSTEM_ADMIN",
      food_business: "RESTAURANT_ADMIN",
      event_organizer: "EVENT_ORGANIZER",
      user: "CUSTOMER",
      authenticated: "CUSTOMER",
    };

    const role = roleMap[supabaseRole] ?? "CUSTOMER";

    // Create new user mapped to Supabase identity
    const user = await this.prisma.user.create({
      data: {
        email: email ?? `supabase-${supabasePayload.sub}@foodride.local`,
        passwordHash: "supabase-managed",
        role: role as any,
        language: supabasePayload.user_metadata?.language ?? "en",
        country: supabasePayload.user_metadata?.country,
      },
    });

    return user;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
