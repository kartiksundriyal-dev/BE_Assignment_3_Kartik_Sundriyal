import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AuthToken, TokenPurpose } from './entities/auth-token.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthTokensService {
  constructor(
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createEmailVerificationToken(userId: string): Promise<string> {
    const payload = {
      sub: userId,
      purpose: TokenPurpose.EMAIL_VERIFICATION,
    };
    const jwtToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_EMAIL_VERIFICATION_SECRET'),
      expiresIn: '24h',
    });

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    const authToken = this.authTokenRepository.create({
      userId,
      tokenValue: jwtToken,
      purpose: TokenPurpose.EMAIL_VERIFICATION,
      expiry,
      status: 'active',
    });

    await this.authTokenRepository.save(authToken);
    return jwtToken;
  }

  async findValidEmailVerificationToken(
    tokenValue: string,
  ): Promise<AuthToken | null> {
    return await this.authTokenRepository.findOne({
      where: {
        tokenValue,
        purpose: TokenPurpose.EMAIL_VERIFICATION,
        status: 'active',
        expiry: MoreThan(new Date()),
      },
      relations: ['user'],
    });
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await this.authTokenRepository.update(tokenId, {
      status: 'used',
    });
  }

  async deleteUserTokens(userId: string, purpose: TokenPurpose): Promise<void> {
    await this.authTokenRepository.delete({
      userId,
      purpose,
    });
  }
}
