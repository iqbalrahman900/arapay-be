// payments/payments.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Request, Res, HttpStatus, Inject, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, ProcessPaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { InvoicesService } from '../invoices/invoices.service';
import { PaymentStatus as InvoicePaymentStatus } from '../invoices/schemas/invoice.schema';
import { Types } from 'mongoose';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment successfully created' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Returns all payments' })
  findAll() {
    return this.paymentsService.findAll();
  }

  // ✅ SPECIFIC ROUTES FIRST - Order matters!
  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Returns payment statistics' })
  getStatistics() {
    return this.paymentsService.getPaymentStatistics();
  }

  // ✅ PUBLIC ENDPOINTS - MUST come before /:id route
  @Get('process/:token')
  @ApiOperation({ summary: 'Display payment page for customer (Public)' })
  @ApiResponse({ status: 200, description: 'Payment page data returned' })
  @ApiResponse({ status: 400, description: 'Payment link expired or invalid' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async showPaymentPage(@Param('token') token: string, @Res() res: Response) {
    try {
      const isValid = await this.paymentsService.isPaymentLinkValid(token);
      
      
      if (!isValid) {
        
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Payment link has expired or is no longer valid'
        });
      }

      
      const payment = await this.paymentsService.findByToken(token);
      console.log('Payment found:', {
        id: payment._id,
        invoiceRef: payment.invoice,
        invoiceType: typeof payment.invoice,
        isPopulated: payment.invoice && typeof payment.invoice === 'object' && (payment.invoice as any)._id
      });
      let invoice;
      if (payment.invoice && typeof payment.invoice === 'object' && (payment.invoice as any)._id && (payment.invoice as any).invoiceId) {

        
        invoice = payment.invoice;
      } else {
          
        let invoiceId: string;
        if (payment.invoice instanceof Types.ObjectId) {
          invoiceId = payment.invoice.toString();
        } else if (typeof payment.invoice === 'string') {
          invoiceId = payment.invoice;
        } else {
          invoiceId = String(payment.invoice);
        }
        
        
        invoice = await this.invoicesService.findById(invoiceId);
      }
      
      console.log('Invoice details:', {
        id: invoice._id,
        invoiceId: invoice.invoiceId,
        customerName: invoice.customerName
      });
      
      
      return res.status(HttpStatus.OK).json({
        success: true,
        data: {
          paymentToken: token,
          payment: {
            id: payment._id,
            amount: payment.amount,
            status: payment.status,
            expiresAt: payment.expiresAt,
          },
          invoice: {
            id: invoice._id,
            invoiceId: invoice.invoiceId,
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            amountDue: invoice.amountDue,
            dueDate: invoice.dueDate,
            invoiceDate: invoice.invoiceDate,
            description: invoice.description,
          },
        },
      });
    } catch (error) {
      
      
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Payment link not found'
      });
    }
  }

  @Post('process/:token')
  @ApiOperation({ summary: 'Process payment from customer (Public)' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Payment processing failed' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async processPayment(
    @Param('token') token: string,
    @Body() paymentDetails: ProcessPaymentDto,
    @Res() res: Response,
  ) {
    try {
      const payment = await this.paymentsService.processPayment(token, paymentDetails);
      let invoiceId: string;
      if (payment.invoice instanceof Types.ObjectId) {
        invoiceId = payment.invoice.toString();
      } else if (typeof payment.invoice === 'object' && (payment.invoice as any)._id) {
        invoiceId = (payment.invoice as any)._id.toString();
      } else {
        invoiceId = String(payment.invoice);
      }
      
      await this.invoicesService.updatePaymentStatus(invoiceId, InvoicePaymentStatus.PAID);
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: `Payment of ${payment.amount} completed successfully`,
        data: {
          payment: {
            id: payment._id,
            amount: payment.amount,
            status: payment.status,
            transactionId: payment.transactionId,
            processedAt: payment.processedAt,
          },
        },
      });
    } catch (error) {
      const statusCode = error.status || HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Payment processing failed',
      });
    }
  }

  @Post('validate/:token')
  @ApiOperation({ summary: 'Validate payment link (Public)' })
  @ApiResponse({ status: 200, description: 'Payment link validation result' })
  async validatePaymentLink(@Param('token') token: string, @Res() res: Response) {
    try {
      const isValid = await this.paymentsService.isPaymentLinkValid(token);
      
      if (isValid) {
        const payment = await this.paymentsService.findByToken(token);
        return res.status(HttpStatus.OK).json({
          success: true,
          valid: true,
          data: {
            expiresAt: payment.expiresAt,
            amount: payment.amount,
          },
        });
      } else {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          valid: false,
          message: 'Payment link is expired or invalid',
        });
      }
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        valid: false,
        message: 'Payment link not found',
      });
    }
  }

  @Post('create-link/:invoiceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment link for invoice' })
  @ApiResponse({ status: 200, description: 'Payment link created successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 400, description: 'Invoice is already paid' })
  async createPaymentLink(@Param('invoiceId') invoiceId: string) {    
    try {
      // Get invoice details first
      
      const invoice = await this.invoicesService.findById(invoiceId);
      console.log('Controller: Invoice found:', {
        id: invoice._id,
        invoiceId: invoice.invoiceId,
        paymentStatus: invoice.paymentStatus,
        amountDue: invoice.amountDue
      });
      
      // Check if invoice is already paid
      if (invoice.paymentStatus === InvoicePaymentStatus.PAID) {
        
        throw new BadRequestException('Cannot generate payment link for an already paid invoice');
      }

      // Create payment link
      
      const result = await this.paymentsService.createPaymentLink(invoiceId);
      console.log('Controller: Payment link created:', {
        token: result.token,
        paymentLink: result.paymentLink
      });
      
      // Update payment with correct amount
      
      await this.paymentsService.updatePaymentAmount(result.token, invoice.amountDue);
      
      
      // Update the invoice with the payment link
      
      await this.invoicesService.update(invoiceId, { paymentLink: result.paymentLink });
      
      
      const response = {
        success: true,
        message: 'Payment link created successfully',
        data: {
          paymentLink: result.paymentLink,
          token: result.token,
          invoice: {
            id: invoice._id,
            invoiceId: invoice.invoiceId,
            customerName: invoice.customerName,
            amountDue: invoice.amountDue,
          }
        }
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  @Post('create-link-force-new/:invoiceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create NEW payment link for invoice (ignores existing)' })
  async createPaymentLinkForceNew(@Param('invoiceId') invoiceId: string) {
    
    
    try {
      const invoice = await this.invoicesService.findById(invoiceId);
      
      if (invoice.paymentStatus === InvoicePaymentStatus.PAID) {
        throw new BadRequestException('Cannot generate payment link for an already paid invoice');
      }

      // Use the force new method
      const result = await this.paymentsService.createPaymentLinkForceNew(invoiceId);
      await this.paymentsService.updatePaymentAmount(result.token, invoice.amountDue);
      await this.invoicesService.update(invoiceId, { paymentLink: result.paymentLink });
      
      return {
        success: true,
        message: 'NEW Payment link created successfully',
        data: {
          paymentLink: result.paymentLink,
          token: result.token,
          invoice: {
            id: invoice._id,
            invoiceId: invoice.invoiceId,
            customerName: invoice.customerName,
            amountDue: invoice.amountDue,
          }
        }
      };
    } catch (error) {
      console.error('❌ Controller: Error creating FORCE NEW payment link:', error.message);
      throw error;
    }
  }

  @Post('cleanup-expired')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cleanup expired payment links' })
  @ApiResponse({ status: 200, description: 'Expired payments cleaned up' })
  async cleanupExpiredPayments() {
    const cleanedCount = await this.paymentsService.cleanupExpiredPayments();
    return {
      success: true,
      message: `Cleaned up ${cleanedCount} expired payment links`,
      cleanedCount,
    };
  }

  // Debug endpoints (remove in production)
  @Get('debug/invoice/:invoiceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug: Show all payments for an invoice' })
  async debugPaymentsForInvoice(@Param('invoiceId') invoiceId: string) {
    const payments = await this.paymentsService.debugPaymentsForInvoice(invoiceId);
    return {
      success: true,
      invoiceId,
      payments,
      count: payments.length
    };
  }

  @Post('debug/clear/:invoiceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug: Clear all payments for an invoice' })
  async clearTestPayments(@Param('invoiceId') invoiceId: string) {
    const cleared = await this.paymentsService.clearTestPayments(invoiceId);
    return {
      success: true,
      message: `Cleared ${cleared} payments for invoice ${invoiceId}`,
      clearedCount: cleared
    };
  }

  @Post('debug/clear-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debug: Clear ALL pending payments' })
  async clearAllTestPayments() {
    const cleared = await this.paymentsService.clearTestPayments();
    return {
      success: true,
      message: `Cleared ${cleared} pending payments`,
      clearedCount: cleared
    };
  }

  // ✅ GENERIC ROUTES LAST - This catches ObjectId patterns
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by id' })
  @ApiResponse({ status: 200, description: 'Returns the payment' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id') id: string) {
    // Add validation to ensure this is actually an ObjectId
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID format');
    }
    return this.paymentsService.findById(id);
  }
}