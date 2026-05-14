import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";

async function bootstrap() {
  validateEnv();
  await connectDatabase(env.mongodbUri);

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
