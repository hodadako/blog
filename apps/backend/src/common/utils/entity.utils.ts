import { NotFoundException } from '@nestjs/common';
//TODO: 예외를 서비스 전용 예외로 변경하기, 아마 이름도 변경해야할 듯, 함수 명도 requireNonNull 같은 걸로 (Java 스타일로)
export async function throwIfNull<T, E extends new (message: string) => Error>(
  promise: Promise<T | null | undefined>,
  errorMessage: string,
  ErrorClass: E,
): Promise<T> {
  const result = await promise;
  if (result == null) {
    throw new ErrorClass(errorMessage);
  }
  return result;
}

export async function throwNotFoundExceptionIfNull<T>(
  promise: Promise<T | null | undefined>,
  errorMessage: string,
): Promise<T> {
  return throwIfNull(promise, errorMessage, NotFoundException);
}
