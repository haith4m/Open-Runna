import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  private logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: any = {};

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = (exceptionResponse as any).message || exception.message;
      error = (exceptionResponse as any).error || {};
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} - ${statusCode}: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
