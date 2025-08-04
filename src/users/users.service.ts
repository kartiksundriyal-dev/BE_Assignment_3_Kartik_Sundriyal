import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findOne(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  async findById(userId: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { userId },
    });
  }

  async create(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    role: UserRole;
  }): Promise<User> {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const user = this.usersRepository.create({
      email: userData.email,
      passwordHashed: hashedPassword,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      userName: userData.userName || userData.email.split('@')[0],
      role: UserRole.BUYER,
      isEmailVerified: false,
    });

    return await this.usersRepository.save(user);
  }

  async getUserProfile(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHashed: _, ...userResult } = user;
    return userResult;
  }

  async updateUser(id: string, updated: UpdateUserDto) {
    await this.usersRepository.update(id, updated);
    return this.getUserProfile(id);
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.passwordHashed);
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      isEmailVerified: true,
    });
  }
}
