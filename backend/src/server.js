import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

// Bind 0.0.0.0 so Render and other container hosts accept external traffic
app.listen(env.port, "0.0.0.0", () => {
  console.log(`Backend listening on port ${env.port}`);
});
