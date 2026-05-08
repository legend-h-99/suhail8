import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messageAr = 'حدث خطأ غير متوقع';
    let messageEn = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        messageEn = res;
      } else if (res && typeof res === 'object') {
        const r = res as { message?: string | string[]; messageAr?: string };
        messageEn = Array.isArray(r.message) ? r.message.join(', ') : r.message || messageEn;
        messageAr = r.messageAr || translateCommonError(messageEn) || messageAr;
        details = res;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = mapPrismaError(exception);
      status = mapped.status;
      messageAr = mapped.messageAr;
      messageEn = mapped.messageEn;
    } else if (exception instanceof Error) {
      messageEn = exception.message;
    }

    if (status >= 500) {
      this.logger.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      messageAr,
      messageEn,
      path: request.url,
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'production' ? undefined : details,
    });
  }
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError) {
  switch (err.code) {
    case 'P2002':
      return {
        status: HttpStatus.CONFLICT,
        messageAr: 'القيمة موجودة مسبقاً',
        messageEn: 'Duplicate value',
      };
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        messageAr: 'السجل غير موجود',
        messageEn: 'Record not found',
      };
    case 'P2003':
      return {
        status: HttpStatus.BAD_REQUEST,
        messageAr: 'مرجع غير صالح',
        messageEn: 'Invalid foreign key',
      };
    default:
      return {
        status: HttpStatus.BAD_REQUEST,
        messageAr: 'خطأ في قاعدة البيانات',
        messageEn: 'Database error',
      };
  }
}

function translateCommonError(en: string): string | null {
  const map: Record<string, string> = {
    'Unauthorized': 'غير مصرح',
    'Forbidden resource': 'لا تملك صلاحية الوصول',
    'Not Found': 'غير موجود',
    'Bad Request': 'طلب غير صالح',
  };
  return map[en] ?? null;
}
