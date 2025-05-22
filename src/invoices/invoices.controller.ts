// invoices/invoices.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaymentStatus } from './schemas/invoice.schema';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    return this.invoicesService.create(createInvoiceDto, req.user._id);
  }

  @Get()
  @Roles(Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Get all invoices with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns all invoices' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for invoice ID, customer name, or email' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus, description: 'Filter by payment status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (YYYY-MM-DD)' })
  findAll(@Query() query) {
    return this.invoicesService.findAll(query);
  }

  @Get('statistics')
  @Roles(Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Get invoice statistics' })
  @ApiResponse({ status: 200, description: 'Returns invoice statistics' })
  getStatistics() {
    return this.invoicesService.getInvoiceStatistics();
  }

  @Get('overdue')
  @Roles(Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Get overdue invoices' })
  @ApiResponse({ status: 200, description: 'Returns overdue invoices' })
  getOverdueInvoices() {
    return this.invoicesService.getOverdueInvoices();
  }

  @Get(':id')
  @Roles(Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Get invoice by id' })
  @ApiResponse({ status: 200, description: 'Returns the invoice' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Update invoice' })
  @ApiResponse({ status: 200, description: 'Invoice successfully updated' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @Roles(Role.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiResponse({ status: 200, description: 'Invoice successfully deleted' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }


}




