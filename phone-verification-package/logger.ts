/**
 * Simple logger utility
 * Replace with your own logging solution if needed
 */

export interface LogContext {
  [key: string]: any
}

class Logger {
  private isDevelopment: boolean = process.env.NODE_ENV !== 'production'

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '')
    }
  }

  warn(message: string, error?: Error, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, error, context || '')
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, error, context || '')
  }
}

export const logger = new Logger()

