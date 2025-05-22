import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'finance@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ type: [String], enum: Role, default: [Role.FINANCE_MANAGER] })
  @IsArray()
  @IsEnum(Role, { each: true })
  @IsOptional()
  roles?: Role[] = [Role.FINANCE_MANAGER];
}