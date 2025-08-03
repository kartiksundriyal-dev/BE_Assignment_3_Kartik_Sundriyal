import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { EmailVerificationGuard } from './email-verification.guard';
import { AuthGuard } from './auth.guard';
import { UserRole } from './entities/user.entity';
import { UpdateUserDto } from './dtos/update-user.dto';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { NotFoundException } from '@nestjs/common';

describe('UsersController (unit)', () => {
  let controller: UsersController;
  let service: UsersService;

  const userSub = 'user-uuid';
  const mockUser = {
    userId: userSub,
    userName: 'jdoe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: null,
    avatar: null,
    role: UserRole.BUYER,
    isEmailVerified: true,
    userSource: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    zipCode: null,
    country: null,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const userDTO: UpdateUserDto = {
    firstName: 'Jane',
    city: 'Mumbai',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getUserProfile: jest.fn(),
            updateUser: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(EmailVerificationGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('controller should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getProfile()', () => {
    it('returns user profile via service', async () => {
      (service.getUserProfile as jest.Mock).mockResolvedValueOnce(mockUser);

      const req = { user: { sub: userSub } } as unknown as RequestWithUser;
      const result = await controller.getProfile(req);

      expect(result).toEqual(mockUser);
      const spyGetUserProfile = jest.spyOn(service, 'getUserProfile');
      expect(spyGetUserProfile).toHaveBeenCalledWith(userSub);
    });

    it('propagates error when service throws', async () => {
      (service.getUserProfile as jest.Mock).mockRejectedValueOnce(
        new NotFoundException(),
      );

      const req = { user: { sub: userSub } } as unknown as RequestWithUser;
      await expect(controller.getProfile(req)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateProfile()', () => {
    it('passes DTO to service.updateUser and returns updated data', async () => {
      (service.updateUser as jest.Mock).mockResolvedValueOnce({
        ...mockUser,
        ...userDTO,
      });

      const req = { user: { sub: userSub } } as unknown as RequestWithUser;
      const result = await controller.updateProfile(req, userDTO);

      const spyUpdateUser = jest.spyOn(service, 'updateUser');
      expect(spyUpdateUser).toHaveBeenCalledWith(userSub, userDTO);
      expect(result).toMatchObject({
        userId: userSub,
        firstName: userDTO.firstName,
        city: userDTO.city,
      });
    });

    it('propagates error when update fails', async () => {
      (service.updateUser as jest.Mock).mockRejectedValueOnce(
        new NotFoundException(),
      );

      const req = { user: { sub: userSub } } as unknown as RequestWithUser;
      await expect(
        controller.updateProfile(req, userDTO),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
