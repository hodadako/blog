export class ErrorCode {
  readonly code: number;
  readonly message: string;

  private constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
  }

  static readonly ENTITY_NOT_FOUND = new ErrorCode(404, 'Entity not found');
}
