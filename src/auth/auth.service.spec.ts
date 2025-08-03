import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { AuthTokensService } from '../auth-tokens/auth-tokens.service';
import { SignUpDto } from './dtos/sign-up.dto';
import { UserRole } from '../users/entities/user.entity';
import { TokenPurpose } from '../auth-tokens/entities/auth-token.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let emailService: EmailService;
  let authTokensService: AuthTokensService;

  const mockUser = {
    userId: 'user-456',
    userName: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    passwordHashed: '##@HashedPassword',
    role: UserRole.BUYER,
    phone: null,
    avatar: null,
    isEmailVerified: true,
    userSource: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    zipCode: null,
    country: null,
    stripeCustomerId: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockAuthToken = {
    tokenId: 'token-123e',
    user: mockUser,
    userId: mockUser.userId,
    tokenValue: 'jwt-verification-token-value',
    purpose: TokenPurpose.EMAIL_VERIFICATION,
    expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'active',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    verifyPassword: jest.fn(),
    create: jest.fn(),
    verifyEmail: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockAuthTokensService = {
    createEmailVerificationToken: jest.fn(),
    findValidEmailVerificationToken: jest.fn(),
    markTokenAsUsed: jest.fn(),
    deleteUserTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AuthTokensService,
          useValue: mockAuthTokensService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    emailService = module.get<EmailService>(EmailService);
    authTokensService = module.get<AuthTokensService>(AuthTokensService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access token for valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const expectedToken = 'jwt-access-token';

      const findOneSpy = jest.spyOn(usersService, 'findOne');
      const verifyPasswordSpy = jest.spyOn(usersService, 'verifyPassword');
      const signAsyncSpy = jest.spyOn(jwtService, 'signAsync');

      findOneSpy.mockResolvedValue(mockUser);
      verifyPasswordSpy.mockResolvedValue(true);
      signAsyncSpy.mockResolvedValue(expectedToken);

      const result = await service.signIn(email, password);

      expect(findOneSpy).toHaveBeenCalledWith(email);
      expect(verifyPasswordSpy).toHaveBeenCalledWith(mockUser, password);
      expect(signAsyncSpy).toHaveBeenCalledWith({
        sub: mockUser.userId,
        username: mockUser.userName,
      });
      expect(result).toEqual({ access_token: expectedToken });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      const findOneSpy = jest.spyOn(usersService, 'findOne');
      findOneSpy.mockResolvedValue(null);

      await expect(service.signIn(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(findOneSpy).toHaveBeenCalledWith(email);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      const findOneSpy = jest.spyOn(usersService, 'findOne');
      const verifyPasswordSpy = jest.spyOn(usersService, 'verifyPassword');

      findOneSpy.mockResolvedValue(mockUser);
      verifyPasswordSpy.mockResolvedValue(false);

      await expect(service.signIn(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(findOneSpy).toHaveBeenCalledWith(email);
      expect(verifyPasswordSpy).toHaveBeenCalledWith(mockUser, password);
    });

    it('should throw UnauthorizedException when email is not verified', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const unverifiedUser = { ...mockUser, isEmailVerified: false };

      const findOneSpy = jest.spyOn(usersService, 'findOne');
      const verifyPasswordSpy = jest.spyOn(usersService, 'verifyPassword');

      findOneSpy.mockResolvedValue(unverifiedUser);
      verifyPasswordSpy.mockResolvedValue(true);

      await expect(service.signIn(email, password)).rejects.toThrow(
        new UnauthorizedException('Please verify your email before signing in'),
      );

      expect(findOneSpy).toHaveBeenCalledWith(email);
      expect(verifyPasswordSpy).toHaveBeenCalledWith(unverifiedUser, password);
    });
  });

  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
      role: UserRole.BUYER,
    };

    const mockCreatedUser = mockUser;

    it('should create user and send verification email', async () => {
      const verificationToken = 'verification-token-123';

      const findOneSpy = jest.spyOn(usersService, 'findOne');
      const createSpy = jest.spyOn(usersService, 'create');
      const createTokenSpy = jest.spyOn(
        authTokensService,
        'createEmailVerificationToken',
      );
      const sendEmailSpy = jest.spyOn(emailService, 'sendVerificationEmail');

      findOneSpy.mockResolvedValue(null);
      createSpy.mockResolvedValue(mockCreatedUser);
      createTokenSpy.mockResolvedValue(verificationToken);
      sendEmailSpy.mockResolvedValue(undefined);

      const result = await service.signUp(signUpDto);

      expect(findOneSpy).toHaveBeenCalledWith(signUpDto.email);
      expect(createSpy).toHaveBeenCalledWith({
        email: signUpDto.email,
        password: signUpDto.password,
        role: signUpDto.role,
      });
      expect(createTokenSpy).toHaveBeenCalledWith(mockCreatedUser.userId);
      expect(sendEmailSpy).toHaveBeenCalledWith(
        signUpDto.email,
        verificationToken,
      );
      expect(result).toEqual({
        message:
          'Account created successfully. Please check your email to verify your account.',
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      const existingUser = mockUser;

      const findOneSpy = jest.spyOn(usersService, 'findOne');
      findOneSpy.mockResolvedValue(existingUser);

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );

      expect(findOneSpy).toHaveBeenCalledWith(signUpDto.email);
    });
  });

  describe('verifyEmail', () => {
    const token = 'valid-verification-token';

    const mockPayload = {
      sub: 'user-456',
      purpose: TokenPurpose.EMAIL_VERIFICATION,
    };

    it('should verify email successfully', async () => {
      const findTokenSpy = jest.spyOn(
        authTokensService,
        'findValidEmailVerificationToken',
      );
      const verifyAsyncSpy = jest.spyOn(jwtService, 'verifyAsync');
      const getSpy = jest.spyOn(configService, 'get');
      const verifyEmailSpy = jest.spyOn(usersService, 'verifyEmail');
      const markTokenSpy = jest.spyOn(authTokensService, 'markTokenAsUsed');

      findTokenSpy.mockResolvedValue(mockAuthToken);
      verifyAsyncSpy.mockResolvedValue(mockPayload);
      getSpy.mockReturnValue('jwt-secret');
      verifyEmailSpy.mockResolvedValue(undefined);
      markTokenSpy.mockResolvedValue(undefined);

      const result = await service.verifyEmail(token);

      expect(findTokenSpy).toHaveBeenCalledWith(token);
      expect(verifyAsyncSpy).toHaveBeenCalledWith(token, {
        secret: 'jwt-secret',
      });
      expect(getSpy).toHaveBeenCalledWith('JWT_EMAIL_VERIFICATION_SECRET');
      expect(verifyEmailSpy).toHaveBeenCalledWith(mockAuthToken.userId);
      expect(markTokenSpy).toHaveBeenCalledWith(mockAuthToken.tokenId);
      expect(result).toEqual({
        message: 'Email verified successfully. You can now sign in.',
      });
    });

    it('should throw BadRequestException when token not found', async () => {
      const findTokenSpy = jest.spyOn(
        authTokensService,
        'findValidEmailVerificationToken',
      );
      findTokenSpy.mockResolvedValue(null);

      await expect(service.verifyEmail(token)).rejects.toThrow(
        new BadRequestException('Invalid or expired verification token'),
      );

      expect(findTokenSpy).toHaveBeenCalledWith(token);
    });

    it('should throw BadRequestException when user ID mismatch', async () => {
      const mismatchedPayload = { ...mockPayload, sub: 'different-user-id' };

      const findTokenSpy = jest.spyOn(
        authTokensService,
        'findValidEmailVerificationToken',
      );
      const verifyAsyncSpy = jest.spyOn(jwtService, 'verifyAsync');
      const getSpy = jest.spyOn(configService, 'get');

      findTokenSpy.mockResolvedValue(mockAuthToken);
      verifyAsyncSpy.mockResolvedValue(mismatchedPayload);
      getSpy.mockReturnValue('jwt-secret');

      await expect(service.verifyEmail(token)).rejects.toThrow(
        new BadRequestException('Invalid verification token'),
      );
    });

    it('should throw BadRequestException when JWT is invalid', async () => {
      const findTokenSpy = jest.spyOn(
        authTokensService,
        'findValidEmailVerificationToken',
      );
      const verifyAsyncSpy = jest.spyOn(jwtService, 'verifyAsync');
      const getSpy = jest.spyOn(configService, 'get');

      findTokenSpy.mockResolvedValue(mockAuthToken);
      getSpy.mockReturnValue('jwt-secret');

      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';
      verifyAsyncSpy.mockRejectedValue(jwtError);

      await expect(service.verifyEmail(token)).rejects.toThrow(
        new BadRequestException('Invalid or expired verification token'),
      );
    });

    it('should throw BadRequestException when JWT is expired', async () => {
      const findTokenSpy = jest.spyOn(
        authTokensService,
        'findValidEmailVerificationToken',
      );
      const verifyAsyncSpy = jest.spyOn(jwtService, 'verifyAsync');
      const getSpy = jest.spyOn(configService, 'get');

      findTokenSpy.mockResolvedValue(mockAuthToken);
      getSpy.mockReturnValue('jwt-secret');

      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      verifyAsyncSpy.mockRejectedValue(expiredError);

      await expect(service.verifyEmail(token)).rejects.toThrow(
        new BadRequestException('Invalid or expired verification token'),
      );
    });
  });

  describe('resendVerificationEmail', () => {
    const email = 'test@example.com';

    it('should resend verification email successfully', async () => {
      const verificationToken = 'new-verification-token';

      const findOneSpy = jest.spyOn(usersService, 'findOne');
      const deleteTokensSpy = jest.spyOn(authTokensService, 'deleteUserTokens');
      const createTokenSpy = jest.spyOn(
        authTokensService,
        'createEmailVerificationToken',
      );
      const sendEmailSpy = jest.spyOn(emailService, 'sendVerificationEmail');

      findOneSpy.mockResolvedValue({ ...mockUser, isEmailVerified: false });
      deleteTokensSpy.mockResolvedValue(undefined);
      createTokenSpy.mockResolvedValue(verificationToken);
      sendEmailSpy.mockResolvedValue(undefined);

      const result = await service.resendVerificationEmail(email);

      expect(findOneSpy).toHaveBeenCalledWith(email);
      expect(deleteTokensSpy).toHaveBeenCalledWith(
        mockUser.userId,
        TokenPurpose.EMAIL_VERIFICATION,
      );
      expect(createTokenSpy).toHaveBeenCalledWith(mockUser.userId);
      expect(sendEmailSpy).toHaveBeenCalledWith(email, verificationToken);
      expect(result).toEqual({
        message: 'Verification email sent. Please check your email.',
      });
    });

    it('should throw BadRequestException when user not found', async () => {
      const findOneSpy = jest.spyOn(usersService, 'findOne');
      findOneSpy.mockResolvedValue(null);

      await expect(service.resendVerificationEmail(email)).rejects.toThrow(
        new BadRequestException('User not found'),
      );

      expect(findOneSpy).toHaveBeenCalledWith(email);
    });

    it('should throw BadRequestException when email already verified', async () => {
      const verifiedUser = { ...mockUser, isEmailVerified: true };

      const findOneSpy = jest.spyOn(usersService, 'findOne');
      findOneSpy.mockResolvedValue(verifiedUser);

      await expect(service.resendVerificationEmail(email)).rejects.toThrow(
        new BadRequestException('Email is already verified'),
      );

      expect(findOneSpy).toHaveBeenCalledWith(email);
    });
  });
});
