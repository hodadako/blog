import { ErrorCode, ServiceException } from '@backend/common';

export async function throwIfNull<T, E extends Error>(
  promise: Promise<T | null | undefined>,
  ErrorClass: E,
): Promise<T> {
  const result = await promise;
  if (result == null) {
    throw ErrorClass;
  }
  return result;
}

export async function throwServiceExceptionIfNull<T>(
  promise: Promise<T | null | undefined>,
  errorMessage: string,
  errorCode: ErrorCode,
): Promise<T> {
  return throwIfNull(promise, new ServiceException(errorCode, errorMessage));
}

export async function throwIfEntityNotFound<T>(
  promise: Promise<T | null | undefined>,
  errorMessage: string,
): Promise<T> {
  return throwServiceExceptionIfNull(
    promise,
    errorMessage,
    ErrorCode.ENTITY_NOT_FOUND,
  );
}
