import pino, { LoggerOptions } from 'pino';
import pinoHttp, { Options as PinoHttpOptions } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { recordHttpRequest } from './metrics';

const level = process.env.LOG_LEVEL || 'info';

const baseLoggerOptions: LoggerOptions = {
  level,
  messageKey: 'message',
  timestamp: pino.stdTimeFunctions.isoTime,
};

export const logger = pino(baseLoggerOptions);

/**
 * Генерация компактного requestId.
 * Используем crypto.randomUUID при наличии, иначе randomBytes.
 */
export const createRequestId = (): string => {
  if (typeof crypto.randomUUID === 'function') {
    // Берём укороченный вариант uuid для компактности.
    return crypto.randomUUID().split('-')[0];
  }
  return crypto.randomBytes(8).toString('hex');
};

const httpLoggerOptions: PinoHttpOptions = {
  logger,
  customLogLevel: (res: ServerResponse, err: Error | null) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req(req: IncomingMessage & { method?: string; url?: string }) {
      return {
        method: req.method,
        url: req.url,
      };
    },
    res(res: ServerResponse & { statusCode?: number }) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  customProps: (
    req: IncomingMessage & { requestId?: string; user?: { id?: string } },
    res: ServerResponse
  ) => {
    const headerReqId = req.headers?.['x-request-id'];
    const responseReqId =
      typeof (res as ServerResponse & { getHeader?: any }).getHeader ===
      'function'
        ? (res as ServerResponse & { getHeader: any }).getHeader('X-Request-Id')
        : undefined;

    const requestId =
      req.requestId ||
      (typeof headerReqId === 'string' ? headerReqId : undefined) ||
      (typeof responseReqId === 'string' ? responseReqId : undefined);

    const userId = req.user?.id;

    return {
      requestId,
      userId,
    };
  },
  customSuccessMessage() {
    return 'request completed';
  },
  customErrorMessage(
    _req: IncomingMessage,
    _res: ServerResponse,
    err: Error
  ) {
    return `request errored: ${err?.message || 'unknown error'}`;
  },
  // Хук для будущих метрик: используем responseTime из pino-http (ms)
  onResponse: (
    _req: IncomingMessage,
    res: ServerResponse & { statusCode: number; responseTime?: number }
  ) => {
    const typedRes = res;
    const duration =
      typeof typedRes.responseTime === 'number'
        ? typedRes.responseTime
        : undefined;
    if (typeof duration === 'number') {
      recordHttpRequest(duration, typedRes.statusCode || 0);
    }
  },
};

export const httpLogger = pinoHttp(httpLoggerOptions);