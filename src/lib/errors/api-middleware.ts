/**
 * API route error handling middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleAPIError, toAppError } from './handler';
import { AppError } from './types';

/**
 * Type for API route handlers
 */
export type APIHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse>;

/**
 * Wrap API route handler with error handling
 */
export function withAPIErrorHandler(handler: APIHandler): APIHandler {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      const appError = toAppError(error);
      const { error: errorMessage, code, statusCode } = handleAPIError(appError);

      return NextResponse.json(
        {
          error: errorMessage,
          code,
          timestamp: new Date().toISOString(),
        },
        { status: statusCode }
      );
    }
  };
}

/**
 * Validate request body against schema
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  validator: (body: any) => T
): Promise<T> {
  try {
    const body = await req.json();
    return validator(body);
  } catch (error) {
    throw new AppError(
      'Invalid request body',
      4000, // VALIDATION_GENERIC
      400,
      true,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}
