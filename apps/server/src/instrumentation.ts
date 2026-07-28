import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

try {
  process.loadEnvFile('.env');
} catch (err) {
  const isMissingFile = err instanceof Error && 'code' in err && err.code === 'ENOENT';
  if (!isMissingFile) {
    throw err;
  }
}

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (otlpEndpoint) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'booking-server' }),
    traceExporter: new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    void sdk.shutdown().finally(() => process.exit(0));
  });
} else {
  console.log('OTEL_EXPORTER_OTLP_ENDPOINT not set — skipping OpenTelemetry instrumentation.');
}
