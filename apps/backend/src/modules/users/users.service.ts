import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(
    userId: string,
    dto: { fullName?: string; phone?: string; language?: string; country?: string }
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: dto.phone,
        language: dto.language,
        country: dto.country,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        language: true,
        country: true,
      },
    });
  }

  async savePreferences(
    userId: string,
    dto: {
      dietaryRestrictions?: string[];
      allergies?: string[];
      defaultLocation?: string;
    }
  ) {
    const existing = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (existing) {
      return this.prisma.userPreferences.update({
        where: { userId },
        data: {
          dietaryRestrictions: dto.dietaryRestrictions ?? (existing.dietaryRestrictions ?? undefined),
          allergies: dto.allergies ?? (existing.allergies ?? undefined),
          defaultLocation: dto.defaultLocation ?? existing.defaultLocation,
        },
      });
    }

    return this.prisma.userPreferences.create({
      data: {
        userId,
        dietaryRestrictions: dto.dietaryRestrictions ?? [],
        allergies: dto.allergies ?? [],
        defaultLocation: dto.defaultLocation,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    if (!user) throw new NotFoundException("User not found");
    return user;
  }
}
