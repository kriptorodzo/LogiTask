import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          
          // Log slow requests (>1s)
          if (duration > 1000) {
            this.logger.warn(`[SLOW] ${method} ${url} took ${duration}ms`);
          }
          
          // Log all API requests
          this.logger.log(`[METRIC] ${method} ${url} - ${duration}ms`);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`[ERROR] ${method} ${url} failed after ${duration}ms: ${error.message}`);
        },
      }),
    );
  }
}