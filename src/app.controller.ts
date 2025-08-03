import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AppHealth } from './interfaces/app-health.interface';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): AppHealth {
    return this.appService.getHealth();
  }
}
