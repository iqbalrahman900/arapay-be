// payments/payments.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentDocument> {
    // Generate payment token for tracking if not provided
    const paymentToken = createPaymentDto.paymentToken || uuidv4();
    
    
    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Create the payment
    const paymentData = {
      ...createPaymentDto,
      paymentToken,
      paymentDate: createPaymentDto.paymentDate ? new Date(createPaymentDto.paymentDate) : new Date(),
      expiresAt: createPaymentDto.expiresAt ? new Date(createPaymentDto.expiresAt) : expiresAt,
    };
    
    const createdPayment = new this.paymentModel(paymentData);
    const savedPayment = await createdPayment.save();
    return savedPayment;
  }

  async findAll(): Promise<PaymentDocument[]> {
    return this.paymentModel.find().populate('invoice').exec();
  }

  async findById(id: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findById(id).populate('invoice').exec();
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async findByToken(token: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel
      .findOne({ paymentToken: token })
      .populate('invoice')
      .exec();
      
    if (!payment) {
      throw new NotFoundException(`Payment with token ${token} not found`);
    }
    return payment;
  }

  async findByInvoice(invoiceId: string): Promise<PaymentDocument[]> {
    return this.paymentModel.find({ invoice: invoiceId }).exec();
  }

  async createPaymentLink(invoiceId: string): Promise<{ paymentLink: string; token: string }> {
    
    
    
    // First, let's see what payments exist for this invoice
    const allPaymentsForInvoice = await this.paymentModel.find({ invoice: invoiceId });
    
    allPaymentsForInvoice.forEach((payment, index) => {
      console.log(`Payment ${index + 1}:`, {
        token: payment.paymentToken,
        status: payment.status,
        isUsed: payment.isUsed,
        expiresAt: payment.expiresAt,
        isExpired: payment.expiresAt ? new Date() > payment.expiresAt : false
      });
    });

    // Check if there's already an active payment link for this invoice
    const existingPayment = await this.paymentModel.findOne({
      invoice: invoiceId,
      status: PaymentStatus.PENDING,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    
    
    if (existingPayment) {
      
      
      
      
      
      
      
      const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/${existingPayment.paymentToken}`;
      return {
        paymentLink,
        token: existingPayment.paymentToken
      };
    }
    
    // Test UUID generation
    
    
    
    
    // Generate NEW payment token
    const paymentToken = uuidv4();
    
    
    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    
    // Create a pending payment (we'll get invoice amount from controller)
    const paymentData = {
      invoice: invoiceId,
      amount: 0, // Will be set by controller
      status: PaymentStatus.PENDING,
      paymentToken,
      expiresAt: expiresAt.toISOString(),
    };
    
    
    const newPayment = await this.create(paymentData as CreatePaymentDto);
    
    
    // Generate a payment link with the token
    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/${paymentToken}`;
    
    
    return {
      paymentLink,
      token: paymentToken
    };
  }

  // Alternative method that ALWAYS creates new token (for testing)
  async createPaymentLinkForceNew(invoiceId: string): Promise<{ paymentLink: string; token: string }> {
    
    
    // Generate NEW payment token (skip existing check)
    const paymentToken = uuidv4();
    
    
    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Create a pending payment
    const paymentData = {
      invoice: invoiceId,
      amount: 0,
      status: PaymentStatus.PENDING,
      paymentToken,
      expiresAt: expiresAt.toISOString(),
    };
    
    await this.create(paymentData as CreatePaymentDto);
    
    // Generate a payment link with the token
    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/${paymentToken}`;
    
    return {
      paymentLink,
      token: paymentToken
    };
  }

  async processPayment(token: string, paymentDetails: any): Promise<PaymentDocument> {
    const payment = await this.findByToken(token);
    
    // Validate payment can be processed
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment already ${payment.status}`);
    }

    if (payment.isUsed) {
      throw new BadRequestException('Payment link has already been used');
    }

    // Check if payment link has expired
    if (payment.expiresAt && new Date() > payment.expiresAt) {
      // Mark as expired
      payment.status = PaymentStatus.EXPIRED;
      await payment.save();
      throw new BadRequestException('Payment link has expired');
    }
    
    try {
      // Simulate payment gateway processing
      const isPaymentSuccessful = await this.simulatePaymentGateway(paymentDetails);
      
      if (!isPaymentSuccessful) {
        throw new Error('Payment failed at gateway');
      }

      // Update payment status to completed
      payment.status = PaymentStatus.COMPLETED;
      payment.transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      payment.isUsed = true;
      payment.processedAt = new Date();
      payment.metadata = { ...payment.metadata, ...paymentDetails };
      
      const updatedPayment = await payment.save();
      return updatedPayment;
      
    } catch (error) {
      // Mark payment as failed
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = error.message;
      payment.processedAt = new Date();
      await payment.save();
      
      throw new BadRequestException(`Payment processing failed: ${error.message}`);
    }
  }

  // Simulate payment gateway processing
  private async simulatePaymentGateway(paymentDetails: any): Promise<boolean> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic validation
    if (!paymentDetails.cardNumber || !paymentDetails.cvv || !paymentDetails.expiryDate) {
      return false;
    }

    // Simulate 95% success rate
    return Math.random() > 0.05;
  }

  async isPaymentLinkValid(token: string): Promise<boolean> {
    try {
      const payment = await this.findByToken(token);
      
      // Check if payment is still pending
      if (payment.status !== PaymentStatus.PENDING) {
        return false;
      }

      // Check if already used
      if (payment.isUsed) {
        return false;
      }
      
      // Check if expired
      if (payment.expiresAt && new Date() > payment.expiresAt) {
        // Mark as expired in database
        payment.status = PaymentStatus.EXPIRED;
        await payment.save();
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async getPaymentStatistics(): Promise<any> {
    const totalPayments = await this.paymentModel.countDocuments();
    const completedPayments = await this.paymentModel.countDocuments({ status: PaymentStatus.COMPLETED });
    const pendingPayments = await this.paymentModel.countDocuments({ status: PaymentStatus.PENDING });
    const failedPayments = await this.paymentModel.countDocuments({ status: PaymentStatus.FAILED });
    const expiredPayments = await this.paymentModel.countDocuments({ status: PaymentStatus.EXPIRED });
    
    const totalAmount = await this.paymentModel.aggregate([
      { $match: { status: PaymentStatus.COMPLETED } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      expiredPayments,
      totalAmountCollected: totalAmount.length > 0 ? totalAmount[0].total : 0,
      successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
    };
  }

  async cleanupExpiredPayments(): Promise<number> {
    
    const result = await this.paymentModel.updateMany(
      {
        status: PaymentStatus.PENDING,
        expiresAt: { $lt: new Date() }
      },
      {
        $set: {
          status: PaymentStatus.EXPIRED,
          processedAt: new Date()
        }
      }
    );
    
    
    return result.modifiedCount;
  }

  // Update payment amount (called from controller)
  async updatePaymentAmount(token: string, amount: number): Promise<PaymentDocument> {
    
    const payment = await this.findByToken(token);
    payment.amount = amount;
    const updatedPayment = await payment.save();
    
    return updatedPayment;
  }

  // Debug helper methods
  async debugPaymentsForInvoice(invoiceId: string): Promise<any> {
    const payments = await this.paymentModel.find({ invoice: invoiceId });
    
    
    return payments.map(payment => ({
      id: payment._id,
      token: payment.paymentToken,
      status: payment.status,
      isUsed: payment.isUsed,
      amount: payment.amount,
      expiresAt: payment.expiresAt,
      isExpired: payment.expiresAt ? new Date() > payment.expiresAt : false,
      createdAt: payment.paymentDate
    }));
  }

  async clearTestPayments(invoiceId?: string): Promise<number> {
    const filter = invoiceId ? { invoice: invoiceId } : { status: PaymentStatus.PENDING };
    const result = await this.paymentModel.deleteMany(filter);
    
    return result.deletedCount;
  }
}