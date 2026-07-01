import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../error-codes';
import { BusinessException } from '../exceptions/business.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = ErrorCode.BAD_REQUEST;
    let message = '服务器内部错误';

    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      const body = exception.getResponse() as { code: ErrorCode; message: string };
      code = body.code;
      message = body.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        if (Array.isArray(obj.message)) {
          message = String(obj.message[0]);
          code = ErrorCode.VALIDATION_FAILED;
        } else if (typeof obj.message === 'string') {
          message = obj.message;
        }
      }
      if (status === HttpStatus.UNAUTHORIZED) code = ErrorCode.UNAUTHORIZED;
      if (status === HttpStatus.FORBIDDEN) code = ErrorCode.FORBIDDEN;
      if (status === HttpStatus.NOT_FOUND) code = ErrorCode.NOT_FOUND;
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      message = exception.message;
    }

    response.status(status).json({ code, message, data: null });
  }
}
