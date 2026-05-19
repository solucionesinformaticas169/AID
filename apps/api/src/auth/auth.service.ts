import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";

import { ROLE_CODES } from "../common/constants/role-codes";
import { AuthRepository } from "./repositories/auth.repository";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(payload: RegisterDto) {
    const existingUser = await this.authRepository.findUserByEmail(payload.email);

    if (existingUser) {
      throw new BadRequestException("El correo ya esta registrado.");
    }

    const role = await this.authRepository.findRoleByCode(payload.roleCode ?? ROLE_CODES.CANDIDATE);

    if (!role) {
      throw new BadRequestException("El rol solicitado no existe.");
    }

    const passwordHash = await hash(payload.password, 10);
    const user = await this.authRepository.createUser({
      email: payload.email,
      passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      primaryRoleId: role.id,
    });
    const companyId = this.resolveCompanyId(user.companyUsers);

    const tokens = await this.issueTokens(user.id, user.email, role.code, companyId);
    await this.authRepository.updateRefreshTokenHash(user.id, await hash(tokens.refreshToken, 10));

    return {
      message: "Usuario registrado correctamente.",
      user: this.serializeUser(
        user.id,
        user.email,
        role.code,
        `${user.firstName} ${user.lastName}`,
        companyId,
      ),
      ...tokens,
    };
  }

  async login(payload: LoginDto) {
    const user = await this.authRepository.findUserByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException("Credenciales invalidas.");
    }

    const isPasswordValid = await compare(payload.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciales invalidas.");
    }

    const roleCode = user.primaryRole?.code ?? ROLE_CODES.CANDIDATE;
    const companyId = this.resolveCompanyId(user.companyUsers);
    const tokens = await this.issueTokens(user.id, user.email, roleCode, companyId);
    await this.authRepository.updateRefreshTokenHash(user.id, await hash(tokens.refreshToken, 10));

    return {
      message: "Sesion iniciada correctamente.",
      user: this.serializeUser(
        user.id,
        user.email,
        roleCode,
        `${user.firstName} ${user.lastName}`,
        companyId,
      ),
      ...tokens,
    };
  }

  async refresh(payload: RefreshTokenDto) {
      const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET") ?? "refresh-secret";

    try {
      const decoded = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
        companyId?: string;
      }>(payload.refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.authRepository.findUserById(decoded.sub);

      if (!user?.refreshTokenHash) {
        throw new UnauthorizedException("Sesion no valida para renovacion.");
      }

      const refreshTokenMatches = await compare(payload.refreshToken, user.refreshTokenHash);

      if (!refreshTokenMatches) {
        throw new UnauthorizedException("Refresh token invalido.");
      }

      const roleCode = user.primaryRole?.code ?? decoded.role;
      const companyId = this.resolveCompanyId(user.companyUsers) ?? decoded.companyId;
      const tokens = await this.issueTokens(user.id, user.email, roleCode, companyId);
      await this.authRepository.updateRefreshTokenHash(user.id, await hash(tokens.refreshToken, 10));

      return {
        message: "Sesion renovada correctamente.",
        user: this.serializeUser(
          user.id,
          user.email,
          roleCode,
          `${user.firstName} ${user.lastName}`,
          companyId,
        ),
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("No se pudo renovar la sesion.");
    }
  }

  async logout(userId: string, _payload: LogoutDto) {
    await this.authRepository.updateRefreshTokenHash(userId, null);

    return {
      message: "Sesion cerrada correctamente.",
    };
  }

  private async issueTokens(userId: string, email: string, role: string, companyId?: string | null) {
    const accessSecret = this.configService.get<string>("JWT_ACCESS_SECRET") ?? "access-secret";
    const refreshSecret = this.configService.get<string>("JWT_REFRESH_SECRET") ?? "refresh-secret";
    const accessTokenExpiresIn = this.configService.get<string>("JWT_ACCESS_EXPIRES_IN") ?? "15m";
    const refreshTokenExpiresIn = this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "7d";
    const tokenPayload = { sub: userId, email, role, companyId: companyId ?? undefined };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, {
        secret: accessSecret,
        expiresIn: accessTokenExpiresIn as never,
      }),
      this.jwtService.signAsync(tokenPayload, {
        secret: refreshSecret,
        expiresIn: refreshTokenExpiresIn as never,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private serializeUser(
    id: string,
    email: string,
    role: string,
    name: string,
    companyId?: string | null,
  ) {
    return { id, email, role, name, companyId: companyId ?? null };
  }

  private resolveCompanyId(companyUsers: Array<{ companyId: string }> | undefined) {
    return companyUsers?.[0]?.companyId ?? null;
  }
}
