import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { EmailVerificationGuard } from './email-verification.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('user')
@UseGuards(AuthGuard, EmailVerificationGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @HttpCode(HttpStatus.OK)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return this.usersService.getUserProfile(req.user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('profile')
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() updated: UpdateUserDto,
  ) {
    return this.usersService.updateUser(req.user.sub, updated);
  }
}
