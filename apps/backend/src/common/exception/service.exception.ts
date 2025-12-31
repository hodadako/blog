import { ErrorCode } from '@backend/common/exception/error.code';

export class ServiceException extends Error {
  constructor(errorCode: ErrorCode, message?: string) {
    super(message ?? errorCode.message);
    this.name = 'ServiceException';
  }
}
