// invoices/invoices.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument, PaymentStatus } from './schemas/invoice.schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, userId: string): Promise<InvoiceDocument> {
    const createdInvoice = new this.invoiceModel({
      ...createInvoiceDto,
      createdBy: userId,
    });
    return createdInvoice.save();
  }

  async findAll(query?: any): Promise<InvoiceDocument[]> {
    const { search, status, startDate, endDate, ...filters } = query || {};
    
    const filter: any = { ...filters };
    
    if (search) {
      filter.$or = [
        { invoiceId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      filter.paymentStatus = status;
    }
    
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }
    
    return this.invoiceModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel.findById(id).exec();
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceDocument> {
    const invoice = await this.invoiceModel.findOne({ invoiceId }).exec();
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }
    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<InvoiceDocument> {
    const updatedInvoice = await this.invoiceModel
      .findByIdAndUpdate(id, updateInvoiceDto, { new: true })
      .exec();
    if (!updatedInvoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return updatedInvoice;
  }

  async remove(id: string): Promise<InvoiceDocument> {
    const deletedInvoice = await this.invoiceModel.findByIdAndDelete(id).exec();
    if (!deletedInvoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return deletedInvoice;
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<InvoiceDocument> {
    return this.update(id, { paymentStatus: status });
  }

  async getInvoiceStatistics(): Promise<any> {
    const totalInvoices = await this.invoiceModel.countDocuments();
    const paidInvoices = await this.invoiceModel.countDocuments({ paymentStatus: PaymentStatus.PAID });
    const unpaidInvoices = await this.invoiceModel.countDocuments({ paymentStatus: PaymentStatus.UNPAID });
    const overdueInvoices = await this.invoiceModel.countDocuments({
      paymentStatus: PaymentStatus.UNPAID,
      dueDate: { $lt: new Date() }
    });
    
    const totalAmount = await this.invoiceModel.aggregate([
      { $group: { _id: null, total: { $sum: '$amountDue' } } }
    ]);
    
    const paidAmount = await this.invoiceModel.aggregate([
      { $match: { paymentStatus: PaymentStatus.PAID } },
      { $group: { _id: null, total: { $sum: '$amountDue' } } }
    ]);
    
    return {
      totalInvoices,
      paidInvoices,
      unpaidInvoices,
      overdueInvoices,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      paidAmount: paidAmount.length > 0 ? paidAmount[0].total : 0,
      collectionRate: totalAmount.length > 0 ? (paidAmount.length > 0 ? paidAmount[0].total : 0) / totalAmount[0].total * 100 : 0,
    };
  }

  async getOverdueInvoices(): Promise<InvoiceDocument[]> {
    return this.invoiceModel.find({
      paymentStatus: PaymentStatus.UNPAID,
      dueDate: { $lt: new Date() }
    }).sort({ dueDate: 1 }).exec();
  }
}