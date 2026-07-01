import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from '../error-codes';

export class BusinessException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        code,
        message: message || ErrorMessages[code] || '业务错误',
      },
      status,
    );
  }
}
