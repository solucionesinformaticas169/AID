import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { Public } from "../common/decorators/public.decorator";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("verify-email")
  verifyEmail(@Body() payload: VerifyEmailDto) {
    return this.authService.verifyEmail(payload);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("resend-verification")
  resendVerification(@Body() payload: ResendVerificationDto) {
    return this.authService.resendVerification(payload);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: () => Number(process.env.LOGIN_MAX_ATTEMPTS ?? "5"),
      ttl: () => Number(process.env.RATE_LIMIT_TTL_SECONDS ?? "60") * 1000,
    },
  })
  @Post("login")
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  refresh(@Body() payload: RefreshTokenDto) {
    return this.authService.refresh(payload);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: () => Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS ?? "3"),
      ttl: () => Number(process.env.RATE_LIMIT_TTL_SECONDS ?? "60") * 1000,
    },
  })
  @Post("forgot-password")
  forgotPassword(@Body() payload: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(payload);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword(payload);
  }

  @HttpCode(HttpStatus.OK)
  @Post("logout")
  logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() payload: LogoutDto,
  ) {
    return this.authService.logout(user, payload);
  }

  @Get("sessions")
  getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listSessions(user.sub, user.sessionId);
  }

  @Delete("sessions/:sessionId")
  revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sessionId") sessionId: string,
  ) {
    return this.authService.revokeSession(user, sessionId);
  }

  @Delete("sessions")
  revokeAllSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.revokeAllSessions(user.sub, user.sessionId);
  }
}
