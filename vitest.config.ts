import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/lambdas/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
    singleThread: true,
    isolate: false,
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    pool: "threads"
  },
});