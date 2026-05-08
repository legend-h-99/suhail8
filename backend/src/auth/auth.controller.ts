import { Body, Controller, HttpCode, Post, Get, Res, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';

const REFRESH_COOKIE = 'refresh_token';

@ApiTags('Auth — تسجيل الدخول')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, refreshToken: string, maxAgeSeconds: number) {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: maxAgeSeconds * 1000,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'تسجيل الدخول' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto.email, dto.password, dto.tenantSlug);
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresIn);
    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'تجديد الجلسة' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      this.clearRefreshCookie(res);
      throw new (await import('@nestjs/common')).UnauthorizedException({ messageAr: 'الجلسة منتهية' });
    }
    const result = await this.auth.refresh(token);
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresIn);
    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'تسجيل الخروج' })
  async logout(@CurrentUser() user: RequestUser, @Res({ passthrough: true }) res: Response) {
    this.clearRefreshCookie(res);
    return this.auth.logout(user.userId);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'معلومات المستخدم الحالي والصلاحيات' })
  me(@CurrentUser() user: RequestUser) {
    return user;
  }
}
