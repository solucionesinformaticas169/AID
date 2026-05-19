import { Module } from "@nestjs/common";

import { PlansModule } from "../plans/plans.module";
import { PrismaModule } from "../prisma/prisma.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsWebhooksService } from "./payments-webhooks.service";
import { PayphonePaymentProvider } from "./providers/payphone-payment.provider";
import { PaypalPaymentProvider } from "./providers/paypal-payment.provider";
import { StripePaymentProvider } from "./providers/stripe-payment.provider";
import { PaymentsRepository } from "./repositories/payments.repository";
import { PaymentsService } from "./payments.service";
import { InvoicePdfService } from "./utils/invoice-pdf.service";

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsWebhooksService,
    PaymentsRepository,
    StripePaymentProvider,
    PaypalPaymentProvider,
    PayphonePaymentProvider,
    InvoicePdfService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
