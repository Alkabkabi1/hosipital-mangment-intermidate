// Optional OpenTelemetry initialization.
// This file tries to import OTEL SDK at runtime. If dependencies are absent, it no-ops.

export async function initTracing() {
  const enabled = String(process.env.OTEL_ENABLED || '').toLowerCase();
  if (!['1', 'true', 'yes', 'on'].includes(enabled)) return;
  try {
    // Dynamically import to avoid hard dependency when disabled
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
    const exporter = new OTLPTraceExporter({ url: endpoint });

    const sdk = new NodeSDK({
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations()]
    });

    await sdk.start();
    // eslint-disable-next-line no-console
    console.log('[otel] tracing initialized');

    process.on('beforeExit', async () => {
      try { await sdk.shutdown(); } catch { /* noop */ }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    const msg = (err as any)?.message ?? String(err);
    console.warn('[otel] not initialized (dependencies missing?):', msg);
  }
}
