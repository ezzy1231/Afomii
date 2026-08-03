import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./common/prisma/prisma.module";
import { RedisModule } from "./common/redis/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PartnersModule } from "./modules/partners/partners.module";
import { ReservationsModule } from "./modules/reservations/reservations.module";
import { EventsModule } from "./modules/events/events.module";
import { RidesModule } from "./modules/rides/rides.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env",
    }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    PartnersModule,
    ReservationsModule,
    EventsModule,
    RidesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
