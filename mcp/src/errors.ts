export class LiveMockError extends Error {
  status: number | null;

  constructor(status: number | null, message: string) {
    super(message);
    this.name = "LiveMockError";
    this.status = status;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}
