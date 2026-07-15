/// <reference types="vite/client" />

// `process` is used only inside MCP tool handlers that run in the emitted
// Deno edge function; the browser bundle never evaluates them. Ambient
// declaration so the app-side TS check compiles.
declare const process: { env: Record<string, string | undefined> };
