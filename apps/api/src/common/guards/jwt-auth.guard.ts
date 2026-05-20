import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { RequestWithContext } from "../http/request-context.types";
import { RequestContextService } from "../../observability/request-context.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly requestContextService: RequestContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const authorization = Array.isArray(request.headers.authorization)
      ? request.headers.authorization[0]
      : request.headers.authorization;
    const token = this.extractBearerToken(authorization);

    if (!token) {
      throw new UnauthorizedException("Access token requerido.");
    }

    try {
      const decoded = (await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET") ?? "access-secret",
      })) as Record<string, unknown>;
      request.user = {
        sub: String(decoded.sub),
        email: String(decoded.email),
        role: String(decoded.role),
        companyId: typeof decoded.companyId === "string" ? decoded.companyId : null,
        sessionId: typeof decoded.sid === "string" ? decoded.sid : null,
      };
      this.requestContextService.set({
        userId: request.user?.sub ?? null,
        userRole: request.user?.role ?? null,
        companyId: request.user?.companyId ?? null,
      });
      return true;
    } catch {
      throw new UnauthorizedException("Access token invalido o expirado.");
    }
  }

  private extractBearerToken(authorization?: string) {
    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(" ");
    return type === "Bearer" && token ? token : null;
  }
}
