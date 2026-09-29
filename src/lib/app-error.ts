export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(
    code: string,
    message: string,
    statusCode: number
  ) {
    super(message);

    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}