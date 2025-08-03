import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';
import { UserRole } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signIn: jest.fn(),
    signUp: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should call authService.signIn with correct parameters', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        access_token: 'jwt-token',
      };

      const signInSpy = jest.spyOn(authService, 'signIn');
      signInSpy.mockResolvedValue(expectedResult);

      const result = await controller.signIn(signInDto);

      expect(signInSpy).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle authentication failure', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const error = new Error('Invalid credentials');
      const signInSpy = jest.spyOn(authService, 'signIn');
      signInSpy.mockRejectedValue(error);

      await expect(controller.signIn(signInDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(signInSpy).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
    });
  });

  describe('signUp', () => {
    it('should call authService.signUp with correct parameters', async () => {
      const signUpDto: SignUpDto = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        role: UserRole.BUYER,
      };

      const expectedResult = {
        message: 'User created successfully. Please verify your email.',
        user: { id: 1, email: 'test@example.com', role: UserRole.BUYER },
      };

      const signUpSpy = jest.spyOn(authService, 'signUp');
      signUpSpy.mockResolvedValue(expectedResult);

      const result = await controller.signUp(signUpDto);

      expect(signUpSpy).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle signup errors', async () => {
      const signUpDto: SignUpDto = {
        email: 'existing@example.com',
        password: 'StrongPassword123!',
        role: UserRole.SELLER,
      };

      const error = new Error('User already exists');
      const signUpSpy = jest.spyOn(authService, 'signUp');
      signUpSpy.mockRejectedValue(error);

      await expect(controller.signUp(signUpDto)).rejects.toThrow(
        'User already exists',
      );
      expect(signUpSpy).toHaveBeenCalledWith(signUpDto);
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with correct token', async () => {
      const token = 'valid-jwt-token';
      const expectedResult = {
        message: 'Email verified successfully',
        access_token: 'new-jwt-token',
      };

      const verifyEmailSpy = jest.spyOn(authService, 'verifyEmail');
      verifyEmailSpy.mockResolvedValue(expectedResult);

      const result = await controller.verifyEmail(token);

      expect(verifyEmailSpy).toHaveBeenCalledWith(token);
      expect(result).toEqual(expectedResult);
    });

    it('should handle invalid verification token', async () => {
      const token = 'invalid-token';
      const error = new Error('Invalid or expired token');

      const verifyEmailSpy = jest.spyOn(authService, 'verifyEmail');
      verifyEmailSpy.mockRejectedValue(error);

      await expect(controller.verifyEmail(token)).rejects.toThrow(
        'Invalid or expired token',
      );
      expect(verifyEmailSpy).toHaveBeenCalledWith(token);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should call authService.resendVerificationEmail with correct email', async () => {
      const email = 'test@example.com';
      const expectedResult = {
        message: 'Verification email sent successfully',
      };

      const resendSpy = jest.spyOn(authService, 'resendVerificationEmail');
      resendSpy.mockResolvedValue(expectedResult);

      const result = await controller.resendVerificationEmail(email);

      expect(resendSpy).toHaveBeenCalledWith(email);
      expect(result).toEqual(expectedResult);
    });

    it('should handle resend email errors', async () => {
      const email = 'nonexistent@example.com';
      const error = new Error('User not found');

      const resendSpy = jest.spyOn(authService, 'resendVerificationEmail');
      resendSpy.mockRejectedValue(error);

      await expect(controller.resendVerificationEmail(email)).rejects.toThrow(
        'User not found',
      );
      expect(resendSpy).toHaveBeenCalledWith(email);
    });

    it('should handle invalid email format', async () => {
      const email = 'invalid-email';

      const resendSpy = jest.spyOn(authService, 'resendVerificationEmail');
      resendSpy.mockResolvedValue({ message: 'Email processed' });

      await controller.resendVerificationEmail(email);

      expect(resendSpy).toHaveBeenCalledWith(email);
    });
  });
});
