export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export function success<T>(data?: T): OperationResult<T> {
  return { success: true, data };
}

export function failure<T = void>(error: string): OperationResult<T> {
  return { success: false, error };
}
