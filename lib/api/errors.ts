export interface ValidationError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  public errors: ValidationError[] = [];

  constructor(message: string, errors?: ValidationError[]) {
    super(message);
    this.name = "ApiError";
    if (errors) {
      this.errors = errors;
    }
  }
}
