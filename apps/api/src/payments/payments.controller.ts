import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import type { Response } from "express";

import { ROLE_CODES } from "../common/constants/role-codes";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";
import { ConfirmPayphoneButtonDto } from "./dto/confirm-payphone-button.dto";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { PaymentsService } from "./payments.service";
import { PaymentsWebhooksService } from "./payments-webhooks.service";

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentsWebhooksService: PaymentsWebhooksService,
  ) {}

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get("company/:companyId")
  getCompanyPayments(
    @CurrentUser() user: { sub: string; email: string; role: string; companyId?: string | null },
    @Param("companyId") companyId: string,
  ) {
    return this.paymentsService.getCompanyPayments(user, companyId);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get("company/:companyId/billing-summary")
  getCompanyBillingSummary(
    @CurrentUser() user: { sub: string; email: string; role: string; companyId?: string | null },
    @Param("companyId") companyId: string,
  ) {
    return this.paymentsService.getCompanyBillingSummary(user, companyId);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get("company/:companyId/invoices")
  getCompanyInvoices(
    @CurrentUser() user: { sub: string; email: string; role: string; companyId?: string | null },
    @Param("companyId") companyId: string,
  ) {
    return this.paymentsService.getCompanyInvoices(user, companyId);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Post("checkout")
  createCheckout(
    @CurrentUser() user: { sub: string; email: string; role: string; companyId?: string | null },
    @Body() payload: CreateCheckoutDto,
  ) {
    return this.paymentsService.createCheckoutSession(user, payload);
  }

  @Roles(ROLE_CODES.SYSTEM_ADMIN)
  @Post("confirm")
  confirmPayment(@Body() payload: ConfirmPaymentDto) {
    return this.paymentsService.confirmPayment(payload);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Post("payphone/button/confirm")
  confirmPayphoneButtonPayment(
    @CurrentUser() user: { sub: string; email: string; role: string; companyId?: string | null },
    @Body() payload: ConfirmPayphoneButtonDto,
  ) {
    return this.paymentsService.confirmPayphoneButtonPayment(user, payload);
  }

  @Roles(ROLE_CODES.COMPANY_ADMIN, ROLE_CODES.RECRUITER, ROLE_CODES.SYSTEM_ADMIN)
  @Get("invoices/:invoiceId/pdf")
  async getInvoicePdf(
    @CurrentUser() user: { sub: string; email: string; role: string; companyId?: string | null },
    @Param("invoiceId") invoiceId: string,
    @Res() response: Response,
  ) {
    const pdf = await this.paymentsService.getInvoicePdf(user, invoiceId);

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `inline; filename="${pdf.invoice.invoiceNumber}.pdf"`,
    );
    response.send(pdf.file);
  }

  @Public()
  @Post("webhooks/stripe")
  handleStripeWebhook(
    @Req()
    request: {
      body: Buffer;
      headers: Record<string, string | string[] | undefined>;
    },
  ) {
    return this.paymentsWebhooksService.handleStripeWebhook(request.body, request.headers);
  }

  @Public()
  @Post("webhooks/paypal")
  handlePaypalWebhook(
    @Req()
    request: {
      body: Buffer;
      headers: Record<string, string | string[] | undefined>;
    },
  ) {
    return this.paymentsWebhooksService.handlePaypalWebhook(
      this.parseJsonBuffer(request.body),
      request.headers,
    );
  }

  @Public()
  @Post("webhooks/payphone")
  handlePayphoneWebhook(
    @Req()
    request: {
      body: Buffer;
      headers: Record<string, string | string[] | undefined>;
    },
  ) {
    return this.paymentsWebhooksService.handlePayphoneWebhook(
      request.body,
      this.parseJsonBuffer(request.body),
      request.headers,
    );
  }

  private parseJsonBuffer(body: Buffer) {
    return JSON.parse(body.toString("utf-8")) as Record<string, unknown>;
  }
}
