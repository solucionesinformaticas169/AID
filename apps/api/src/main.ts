import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  const configService = app.get(ConfigService);
  const corsOrigins = resolveCorsOrigins(configService);

  app.use("/api/payments/webhooks", express.raw({ type: "application/json" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (corsOrigins.length === 0 || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const allowVercelPreviews =
        (configService.get<string>("CORS_ALLOW_VERCEL_PREVIEWS") ?? "false").toLowerCase() === "true";

      if (allowVercelPreviews && origin.endsWith(".vercel.app")) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} no autorizado por CORS.`));
    },
    credentials: true,
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

function resolveCorsOrigins(configService: ConfigService) {
  const explicitOrigins = configService.get<string>("CORS_ORIGINS");

  if (explicitOrigins) {
    return explicitOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  const frontendUrl = configService.get<string>("FRONTEND_URL");
  return frontendUrl ? [frontendUrl] : ["http://localhost:3000"];
}

void bootstrap();
