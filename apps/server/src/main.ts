import { createApp } from './app.ts';
import { db } from './db/client.ts';
import { env } from './env.ts';

const app = createApp(db);

app.listen(env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${env.PORT}`);
});
