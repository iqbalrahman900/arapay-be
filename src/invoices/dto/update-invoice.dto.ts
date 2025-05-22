// invoices/dto/update-invoice.dto.ts
import { IsOptional, IsEmail, IsNumber, IsDate, IsEnum, IsString, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../schemas/invoice.schema';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ example: 'INV-12345' })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ example: '2025-05-22T00:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  invoiceDate?: Date;

  @ApiPropertyOptional({ example: '2025-06-22T00:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountDue?: number;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: 'http://localhost:3000/payment/abc123-def456-ghi789' })
  @IsOptional()
  @IsString()
  paymentLink?: string;

  @ApiPropertyOptional({ example: 'Consulting services for April 2025' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Please pay by the due date to avoid late fees' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 250 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPaid?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

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

  @ApiPropertyOptional({ example: '2025-05-22T10:30:00Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date;
}