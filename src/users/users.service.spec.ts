import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dtos/update-user.dto';

type MockRepo = Partial<Record<keyof Repository<User>, jest.Mock>>;

const mockRepoFactory = (): MockRepo => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User> & MockRepo;

  const mockUser: Partial<User> = {
    userId: 'some-uuid',
    userName: 'jdoe',
    email: 'john@example.com',
    passwordHashed: 'hashed_pass',
    role: UserRole.BUYER,
    isEmailVerified: false,
  };
  const user = mockUser as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useFactory: mockRepoFactory },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne()', () => {
    it('returns user when found', async () => {
      const spy = jest.spyOn(repo, 'findOne');
      spy.mockResolvedValueOnce(user);

      const result = await service.findOne('john@example.com');
      expect(result).toEqual(user);
      expect(spy).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
    });

    it('returns null when not found', async () => {
      const spy = jest.spyOn(repo, 'findOne');
      spy.mockResolvedValueOnce(null);

      const result = await service.findOne('none@a.com');
      expect(result).toBeNull();
      expect(spy).toHaveBeenCalledWith({ where: { email: 'none@a.com' } });
    });
  });

  describe('findById()', () => {
    it('returns user when found', async () => {
      const spy = jest.spyOn(repo, 'findOne');
      spy.mockResolvedValueOnce(user);

      const result = await service.findById(user.userId);
      expect(result).toEqual(user);
      expect(spy).toHaveBeenCalledWith({ where: { userId: user.userId } });
    });

    it('returns null when not found', async () => {
      const spy = jest.spyOn(repo, 'findOne');
      spy.mockResolvedValueOnce(null);

      const result = await service.findById('random-id');
      expect(result).toBeNull();
      expect(spy).toHaveBeenCalledWith({ where: { userId: 'random-id' } });
    });
  });

  describe('getUserProfile()', () => {
    it('throws NotFoundException if not found', async () => {
      const spy = jest.spyOn(repo, 'findOne');
      spy.mockResolvedValueOnce(null);

      await expect(service.getUserProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(spy).toHaveBeenCalledWith({ where: { userId: 'nonexistent' } });
    });

    it('returns user minus passwordHashed', async () => {
      const spy = jest.spyOn(repo, 'findOne');
      spy.mockResolvedValueOnce(user);

      const profile = await service.getUserProfile(user.userId);
      expect(profile).not.toHaveProperty('passwordHashed');
      expect(profile).toEqual(
        expect.objectContaining({ userId: user.userId, email: user.email }),
      );
    });
  });

  describe('create()', () => {
    it('hashes password and returns sanitized user', async () => {
      const dto = {
        email: user.email,
        password: 'plain',
        firstName: 'John',
        lastName: 'Doe',
        userName: user.userName,
        role: user.role,
      };
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementationOnce(() => void Promise.resolve('new-hash'));

      const createSpy = jest.spyOn(repo, 'create');
      createSpy.mockReturnValueOnce({
        ...user,
        passwordHashed: 'new-hash',
      } as any);

      const saveSpy = jest.spyOn(repo, 'save');
      saveSpy.mockResolvedValueOnce({
        ...user,
        userId: 'id123',
        passwordHashed: 'new-hash',
      } as any);

      const newUser = await service.create(dto);

      expect(hashSpy).toHaveBeenCalledWith(dto.password, expect.any(Number));
      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(newUser).toMatchObject({ userId: 'id123', email: dto.email });
    });
  });

  describe('verifyPassword()', () => {
    it('returns true when passwords match', async () => {
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => true);

      const ok = await service.verifyPassword(user, 'plain');

      expect(ok).toBe(true);
      expect(compareSpy).toHaveBeenCalledWith('plain', user.passwordHashed);
    });

    it('returns false when passwords do not match', async () => {
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => false);

      const ok = await service.verifyPassword(user, 'plain');

      expect(ok).toBe(false);
      expect(compareSpy).toHaveBeenCalledWith('plain', user.passwordHashed);
    });
  });

  describe('verifyEmail()', () => {
    it('sets isEmailVerified to true', async () => {
      const spyUpdate = jest.spyOn(repo, 'update');
      await service.verifyEmail(user.userId);
      expect(spyUpdate).toHaveBeenCalledWith(user.userId, {
        isEmailVerified: true,
      });
    });
  });

  describe('updateUser()', () => {
    it('writes and returns updated profile (password omitted)', async () => {
      const updatedData: UpdateUserDto = { firstName: 'Jane' };
      const updateSpy = jest
        .spyOn(repo, 'update')
        .mockResolvedValueOnce(undefined);
      const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValueOnce({
        ...user,
        firstName: 'Jane',
      } as User);

      const result = await service.updateUser(user.userId, updatedData);

      expect(updateSpy).toHaveBeenCalledWith(user.userId, updatedData);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { userId: user.userId },
      });
      expect(result).toMatchObject({
        userId: user.userId,
        firstName: 'Jane',
      });
    });
  });
});
