import { NotFoundException } from '@nestjs/common';

export async function throwIfNull<T, E extends new (message: string) => Error>(
  promise: Promise<T | null>,
  errorMessage: string,
  ErrorClass: E,
): Promise<T> {
  const result = await promise;
  if (!result) {
    throw new ErrorClass(errorMessage);
  }
  return result;
}

export async function throwNotFoundExceptionIfNull<T>(
  promise: Promise<T | null>,
  errorMessage: string,
): Promise<T> {
  return throwIfNull(promise, errorMessage, NotFoundException);
}
