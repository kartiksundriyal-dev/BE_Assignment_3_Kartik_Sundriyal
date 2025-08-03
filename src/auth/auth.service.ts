import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SignUpDto } from './dtos/sign-up.dto';
import { EmailVerificationPayload } from './interfaces/email-verification-payload.interface';
import { LogInResponse } from './interfaces/log-in-response.interface';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { AuthTokensService } from '../auth-tokens/auth-tokens.service';
import { TokenPurpose } from '../auth-tokens/entities/auth-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private authTokensService: AuthTokensService,
  ) {}

  async signIn(email: string, passwordInput: string): Promise<LogInResponse> {
    const user = await this.userService.findOne(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.userService.verifyPassword(
      user,
      passwordInput,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before signing in',
      );
    }

    const payload = { sub: user.userId, username: user.userName };

    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async signUp(signUpDto: SignUpDto): Promise<{ message: string }> {
    const { email, password, role } = signUpDto;

    const existingUser = await this.userService.findOne(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.userService.create({
      email,
      password,
      role,
    });

    const verificationToken =
      await this.authTokensService.createEmailVerificationToken(user.userId);

    await this.emailService.sendVerificationEmail(email, verificationToken);

    return {
      message:
        'Account created successfully. Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const authToken =
        await this.authTokensService.findValidEmailVerificationToken(token);

      if (!authToken) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      const payload =
        await this.jwtService.verifyAsync<EmailVerificationPayload>(token, {
          secret: this.configService.get<string>(
            'JWT_EMAIL_VERIFICATION_SECRET',
          ),
        });

      if (authToken.userId !== payload.sub) {
        throw new BadRequestException('Invalid verification token');
      }

      await this.userService.verifyEmail(authToken.userId);

      await this.authTokensService.markTokenAsUsed(authToken.tokenId);

      return {
        message: 'Email verified successfully. You can now sign in.',
      };
    } catch (error) {
      const err = error as Error;
      if (
        err.name === 'JsonWebTokenError' ||
        err.name === 'TokenExpiredError'
      ) {
        throw new BadRequestException('Invalid or expired verification token');
      }
      throw error;
    }
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userService.findOne(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.authTokensService.deleteUserTokens(
      user.userId,
      TokenPurpose.EMAIL_VERIFICATION,
    );

    const verificationToken =
      await this.authTokensService.createEmailVerificationToken(user.userId);

    await this.emailService.sendVerificationEmail(email, verificationToken);

    return {
      message: 'Verification email sent. Please check your email.',
    };
  }
}
