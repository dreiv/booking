import pino from 'pino';
import { trace } from '@opentelemetry/api';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  mixin() {
    const spanContext = trace.getActiveSpan()?.spanContext();
    if (!spanContext) {
      return {};
    }
    return { trace_id: spanContext.traceId, span_id: spanContext.spanId };
  },
});
