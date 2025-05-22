// invoices/schemas/invoice.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export interface InvoiceDocument extends Document {
  _id: Types.ObjectId;
  invoiceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  invoiceDate: Date;
  dueDate: Date;
  amountDue: number;
  paymentStatus: PaymentStatus;
  paymentLink?: string;
  description?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  isActive: boolean;
  lastPaymentAttempt?: Date;
  totalPaid: number;
  currency: string;
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  PARTIAL = 'partial',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, unique: true })
  invoiceId: string;

  @Prop({ required: true, trim: true })
  customerName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  customerEmail: string;

  @Prop({ trim: true })
  customerPhone: string;

  @Prop({ required: true, type: Date })
  invoiceDate: Date;

  @Prop({ required: true, type: Date })
  dueDate: Date;

  @Prop({ required: true, type: Number, min: 0 })
  amountDue: number;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentLink: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  notes: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  lastPaymentAttempt: Date;

  @Prop({ type: Number, default: 0, min: 0 })
  totalPaid: number;

  @Prop({ default: 'USD', uppercase: true })
  currency: string;

  @Prop()
  taxAmount: number;

  @Prop()
  discountAmount: number;

  @Prop({ type: Date })
  paidAt: Date;

  @Prop({ type: Date })
  sentAt: Date;

  @Prop({ default: 0 })
  remindersSent: number;

  @Prop({ type: Date })
  lastReminderSent: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Add indexes
InvoiceSchema.index({ customerEmail: 1 });
InvoiceSchema.index({ paymentStatus: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ createdBy: 1 });