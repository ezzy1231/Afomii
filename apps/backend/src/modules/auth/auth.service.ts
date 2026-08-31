import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";
import * as argon2 from "argon2";
import { v4 as uuid } from "uuid";

@Injectable()
export class AuthService {
  private readonly refreshTokenPrefix = "refresh_token:";

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService
  ) {}

  async signup(dto: {
    email?: string;
    phone?: string;
    password: string;
    role: string;
    language?: string;
    country?: string;
  }) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException("Email or phone already registered");
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role as any,
        language: dto.language ?? "en",
        country: dto.country,
      },
    });

    // Unified envelope: identical shape to login() so clients parse one format (BE-0.5).
    return {
      ...(await this.generateTokens(user.id, user.role)),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        language: user.language,
        country: user.country,
      },
    };
  }

  async login(dto: { email?: string; phone?: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        language: user.language,
        country: user.country,
      },
    };
  }

  async refresh(refreshToken: string) {
    const stored = await this.redisService.get(
      `${this.refreshTokenPrefix}${refreshToken}`
    );

    if (!stored) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
    });

    await this.redisService.del(
      `${this.refreshTokenPrefix}${refreshToken}`
    );

    return this.generateTokens(payload.sub, payload.role);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.redisService.del(
      `${this.refreshTokenPrefix}${refreshToken}`
    );
  }

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRY", "15m"),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRY", "7d"),
    });

    const ttlSeconds = 7 * 24 * 60 * 60;
    await this.redisService.set(
      `${this.refreshTokenPrefix}${refreshToken}`,
      userId,
      ttlSeconds
    );

    return { accessToken, refreshToken };
  }
}
