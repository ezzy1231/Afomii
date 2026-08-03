import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
