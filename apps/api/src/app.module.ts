import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import { AdminModule } from "./admin/admin.module";
import { AuditModule } from "./audit/audit.module";
import { ApplicationsModule } from "./applications/applications.module";
import { AuthModule } from "./auth/auth.module";
import { CandidateModule } from "./candidate/candidate.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AppThrottlerGuard } from "./common/security/app-throttler.guard";
import { SecurityModule } from "./common/security/security.module";
import { CompaniesModule } from "./companies/companies.module";
import { EmailsModule } from "./emails/emails.module";
import { HealthModule } from "./health/health.module";
import { JobsModule } from "./jobs/jobs.module";
import { PaymentsModule } from "./payments/payments.module";
import { PlansModule } from "./plans/plans.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RetentionModule } from "./retention/retention.module";
import { ObservabilityModule } from "./observability/observability.module";
import { UploadsModule } from "./uploads/uploads.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env",
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_SECRET ?? "access-secret",
        signOptions: {
          expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? "15m") as never,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: Number(configService.get<string>("RATE_LIMIT_TTL_SECONDS") ?? "60") * 1000,
            limit: Number(configService.get<string>("RATE_LIMIT_MAX") ?? "100"),
          },
        ],
      }),
    }),
    ObservabilityModule,
    RetentionModule,
    AuditModule,
    SecurityModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    CandidateModule,
    CompaniesModule,
    EmailsModule,
    HealthModule,
    JobsModule,
    ApplicationsModule,
    PlansModule,
    PaymentsModule,
    UploadsModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
