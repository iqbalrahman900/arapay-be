// payments/schemas/payment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  OTHER = 'other',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Invoice', required: true })
  invoice: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: Number, min: 0 })
  amount: number;

  @Prop({ enum: PaymentMethod, default: PaymentMethod.CREDIT_CARD })
  paymentMethod: PaymentMethod;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop()
  transactionId: string;

  @Prop({ unique: true, sparse: true })
  paymentToken: string;

  @Prop({ default: Date.now })
  paymentDate: Date;

  @Prop({ default: Date.now })
  linkCreatedAt: Date;

  @Prop()
  expiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop()
  processedAt: Date;

  @Prop()
  failureReason: string;

  @Prop()
  notes: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);