// payments/dto/create-payment.dto.ts
import { IsNotEmpty, IsOptional, IsNumber, IsEnum, IsString, IsDateString, IsObject, Min, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @ApiProperty({ example: '60d21b4967d0d8992e610c85' })
  @IsNotEmpty()
  @IsString()
  invoice: string;

  @ApiProperty({ example: 500 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CREDIT_CARD })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.CREDIT_CARD;

  @ApiPropertyOptional({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus = PaymentStatus.PENDING;

  @ApiPropertyOptional({ example: 'tx_1234567890' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: '2023-09-25T12:00:00Z' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'Payment for Invoice #12345' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: { cardLast4: '4242', cardBrand: 'visa' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ example: 'abc-123-xyz' })
  @IsOptional()
  @IsString()
  paymentToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failureReason?: string;
}

export class ProcessPaymentDto {
  @ApiProperty({ description: 'Credit card number' })
  @IsString()
  cardNumber: string;

  @ApiProperty({ description: 'Card expiry date (MM/YY)' })
  @IsString()
  expiryDate: string;

  @ApiProperty({ description: 'Card CVV' })
  @IsString()
  cvv: string;

  @ApiProperty({ description: 'Card holder name' })
  @IsString()
  cardHolderName: string;

  @ApiPropertyOptional({ description: 'Customer email for receipt' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;
}