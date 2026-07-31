# Observability

Conventions for logging and tracing in `apps/server`.

## Logging

- **Library**: `pino` (`logger.ts`), structured JSON, level controlled by `LOG_LEVEL` (default
  `info`).
- **Request logging**: `pino-http` is attached in `app.ts` with `autoLogging: false` — access logs
  are not emitted automatically for every request, keeping noisy per-request logs out at low
  value. Request-level logs only exist where a route or middleware logs explicitly.
- **Trace correlation**: every log line automatically includes `trace_id`/`span_id` when an
  OpenTelemetry span is active, via the logger's `mixin()` pulling the active span context. This
  means any log line can be correlated to its trace without extra plumbing at the call site.
- **Error logging convention**: `errorHandler.ts` distinguishes client-caused errors from real
  server faults. A malformed UUID reaching a query (Postgres `22P02`) returns a plain `400` with
  no error-level log — it's a client mistake, not a fault. Anything else unhandled logs at `error`
  level via `req.log.error({ err }, 'Unhandled request error')` before returning a `500`. Keep this
  distinction as new error cases are added — not every 4xx deserves an error-level log entry.

## Tracing

- **SDK**: OpenTelemetry (`instrumentation.ts`), loaded via `--import` before the app starts so
  auto-instrumentation covers Express/pg/etc. from the first request.
- **Conditional on**: `OTEL_EXPORTER_OTLP_ENDPOINT`. If unset, tracing is skipped entirely (logged
  once at startup) rather than failing — safe to run locally without a collector.
- **Exporter**: OTLP over HTTP, service name `booking-server`.
- **Shutdown**: the SDK flushes and shuts down on `SIGTERM`, so traces from an in-flight request
  aren't dropped on a graceful deploy/restart.
- **Where traces go**: Jaeger, per the project's docker-compose services.

## Health & Load Signals

- `GET /health` — used by `load-test.js`'s `setup()` to poll readiness before ramping virtual
  users. Same endpoint is the natural fit for a container orchestrator's liveness/readiness
  probe once this is deployed anywhere.
- Rate-limit responses include standard `RateLimit-*` headers (`standardHeaders: true` in
  `rateLimiter.ts`) — useful for clients and any request-level dashboards, not just for the 429
  case.
