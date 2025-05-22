// invoices/dto/create-invoice.dto.ts
import { IsNotEmpty, IsEmail, IsOptional, IsNumber, IsDate, IsEnum, IsString, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../schemas/invoice.schema';

export class CreateInvoiceDto {
  @ApiProperty({ example: 'INV-12345' })
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ example: '2025-05-22T00:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  invoiceDate: Date;

  @ApiProperty({ example: '2025-06-22T00:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @ApiProperty({ example: 500 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amountDue: number;

  @ApiPropertyOptional({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus = PaymentStatus.UNPAID;

  @ApiPropertyOptional({ example: 'Consulting services for April 2025' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Please pay by the due date to avoid late fees' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}