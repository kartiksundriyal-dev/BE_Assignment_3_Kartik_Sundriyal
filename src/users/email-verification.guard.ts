import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RequestWithUser } from './interfaces/request-with-user.interface';

@Injectable()
export class EmailVerificationGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const fullUser = await this.usersService.findById(user.sub.toString());

    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }

    if (!fullUser.isEmailVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please verify your email to access this resource.',
      );
    }

    return true;
  }
}
