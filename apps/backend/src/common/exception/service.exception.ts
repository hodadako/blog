import { ErrorCode } from '@backend/common/exception/error.code';

export class ServiceException extends Error {
  errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, message?: string) {
    super(message ?? errorCode.message);
    this.name = 'ServiceException';
    this.errorCode = errorCode;
  }
}
