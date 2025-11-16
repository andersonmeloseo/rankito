/**
 * Sistema de Logging Estruturado
 * Facilita debug e rastreamento de operações GSC
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  correlationId?: string;
  userId?: string;
  siteId?: string;
  integrationId?: string;
  operation?: string;
  [key: string]: any;
}

class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Cria novo logger com contexto adicional
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const emoji = {
      debug: '🔍',
      info: '✅',
      warn: '⚠️',
      error: '❌',
    }[level];

    const contextStr = Object.keys(this.context).length > 0
      ? ` [${Object.entries(this.context)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}]`
      : '';

    return `${emoji} ${timestamp}${contextStr} ${message}`;
  }

  debug(message: string, data?: any) {
    console.debug(this.formatMessage('debug', message, data), data || '');
  }

  info(message: string, data?: any) {
    console.log(this.formatMessage('info', message, data), data || '');
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage('warn', message, data), data || '');
  }

  error(message: string, error?: any) {
    console.error(this.formatMessage('error', message, error), error || '');
  }

  /**
   * Gera ID de correlação único para rastrear operações
   */
  static generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Cria logger raiz para operações GSC
 */
export function createLogger(context?: LogContext): Logger {
  return new Logger(context);
}

export { Logger, createLogger as default };
export type { LogContext, LogLevel };
