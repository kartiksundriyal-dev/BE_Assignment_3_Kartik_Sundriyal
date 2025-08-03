import { TokenPurpose } from 'src/auth-tokens/entities/auth-token.entity';

export interface EmailVerificationPayload {
  sub: string;
  purpose: TokenPurpose;
}
