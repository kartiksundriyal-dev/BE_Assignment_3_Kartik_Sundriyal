import { Injectable } from '@nestjs/common';
import { AppHealth } from './interfaces/app-health.interface';

@Injectable()
export class AppService {
  getHealth(): AppHealth {
    return { status: 'ok' };
  }
}
