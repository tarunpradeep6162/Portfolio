import { after } from "next/server";

/**
 * Runs security logging/alerting after the response is sent (Next's
 * after()), so a slow email provider never delays a visitor. Outside a
 * request scope (unit tests, scripts) it falls back to fire-and-forget.
 */
export function inBackground(task: () => Promise<unknown>): void {
  try {
    after(task);
  } catch {
    void task().catch(() => {});
  }
}
