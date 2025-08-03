import { IsNotEmpty, IsEmail, IsEnum, IsStrongPassword } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class SignUpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsEnum(UserRole, {
    message: 'Role must be buyer, seller, or admin',
  })
  role: UserRole;
}
