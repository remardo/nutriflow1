import { logger } from './logger';

/**
 * Базовый hook под метрики HTTP.
 * Сейчас только логируем на debug, без внешних зависимостей.
 * TODO: заменить/расширить интеграцией с prom-client или другим metrics backend.
 */
export const recordHttpRequest = (durationMs: number, statusCode: number): void => {
  logger.debug(
    {
      type: 'http_request_metric',
      durationMs,
      statusCode,
    },
    'http request metric recorded'
  );
};