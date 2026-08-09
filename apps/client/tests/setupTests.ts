import { beforeAll, afterEach, afterAll } from 'vite-plus/test';

if (typeof window !== 'undefined') {
  const { worker } = await import('#/mocks/browser');
  const { mswOptions } = await import('#/mocks/config');

  beforeAll(async () => {
    await worker.start({ quiet: true, ...mswOptions });
  });

  afterEach(() => {
    worker.resetHandlers();
  });

  afterAll(() => {
    worker.stop();
  });
}
