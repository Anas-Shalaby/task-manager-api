import type { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode: number = 200) => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  if (message) response.message = message;
  
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, code: string, message: string, statusCode: number = 500, details?: any) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };
  if (details) response.error.details = details;
  
  return res.status(statusCode).json(response);
};
