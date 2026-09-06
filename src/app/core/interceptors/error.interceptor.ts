import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let safeMessage = 'Something went wrong. Please try again.';

        if (error.error instanceof ErrorEvent) {
          // Client-side or network error
          safeMessage = 'We couldn\'t connect to the server. Please check your internet connection and try again.';
        } else {
          // Check if the backend provided a clean business message
          const backendMessage = error.error?.message;
          const isBusinessException = error.status === 400 || error.status === 409 || error.status === 401 || error.status === 403;
          
          if (backendMessage && isBusinessException && !this.isRawTechnicalError(backendMessage)) {
            // Keep safe backend messages like "Seat not available" or validation errors
            safeMessage = backendMessage;
          } else {
            // Map status codes to human-readable text
            switch (error.status) {
              case 0:
                safeMessage = 'We couldn\'t connect to the server. Please check your internet connection and try again.';
                break;
              case 400:
                safeMessage = 'We couldn\'t process your request. Please check the information you entered and try again.';
                break;
              case 401:
                safeMessage = 'Your session has expired. Please log in again.';
                break;
              case 403:
                safeMessage = 'You don\'t have permission to perform this action.';
                break;
              case 404:
                safeMessage = 'The requested information could not be found. Please try again.';
                break;
              case 409:
                safeMessage = 'This action could not be completed because the information has changed. Please refresh and try again.';
                break;
              case 422:
                safeMessage = 'Some information is invalid. Please check the highlighted fields and try again.';
                break;
              case 500:
              case 502:
              case 503:
              case 504:
                safeMessage = 'Something went wrong on our side. Please try again in a moment.';
                break;
            }
          }
        }

        // Clone the error response to inject the safe human-readable message 
        // without breaking existing component subscribers
        const safeError = new HttpErrorResponse({
          error: { message: safeMessage, originalError: error.error },
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url || undefined
        });

        // Add the safe message directly to the error object 
        // to handle components binding directly to `err.message`
        Object.defineProperty(safeError, 'message', { value: safeMessage });

        return throwError(() => safeError);
      })
    );
  }

  /**
   * Extremely simple heuristic to detect if a backend message is raw technical text.
   * Prevents raw exceptions or stack traces from slipping through.
   */
  private isRawTechnicalError(msg: string): boolean {
    if (!msg) return true;
    
    const technicalPatterns = [
      'Http failure response',
      'Internal Server Error',
      'NullPointerException',
      'java.lang.',
      'SQLIntegrityConstraint',
      'Cannot read properties',
      'org.springframework',
      'HibernateException',
      'SQLState',
      '500 Internal'
    ];

    return technicalPatterns.some(pattern => msg.includes(pattern));
  }
}
