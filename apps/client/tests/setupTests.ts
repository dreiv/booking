import { beforeAll, afterEach, afterAll } from 'vitest';

if (typeof window !== 'undefined') {
  const { worker } = await import('@/mocks/browser');

  beforeAll(async () => {
    await worker.start({ quiet: true, onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    worker.resetHandlers();
  });

  afterAll(() => {
    worker.stop();
  });
}
