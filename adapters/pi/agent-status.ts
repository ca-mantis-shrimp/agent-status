// pi extension: turns pi's lifecycle events into this session's record (README, "The record").
// Link or list it as a pi extension. It never fails pi: errors go to errors.log.
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { appendFileSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type State = "working" | "input-required" | "completed";
type Record = { session: string; state: State; since: string; name?: string; reason?: string };

const root =
  process.env.AGENT_STATUS_DIR ?? join(process.env.XDG_RUNTIME_DIR ?? `/run/user/${process.getuid?.()}`, "agent-status");
const dir = join(root, "sessions");
const now = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");

export default function (pi: ExtensionAPI) {
  let running = false; // inside an agent run, so a closed prompt goes back to working
  let last: Record | undefined; // the record as last written

  // Same session and state as before: keep its since and first reason; a new name still rewrites.
  function write(ctx: ExtensionContext, state: State, reason?: string) {
    const session = ctx.sessionManager.getSessionId();
    const name = pi.getSessionName();
    const same = last?.session === session && last.state === state;
    if (same && last?.name === name) return;
    const rec = {
      harness: "pi",
      session,
      project: ctx.cwd,
      state,
      since: same ? last!.since : now(),
      ...(name ? { name } : {}),
      ...((same ? last!.reason : reason) ? { reason: same ? last!.reason : reason } : {}),
      pid: process.pid,
    };
    mkdirSync(dir, { recursive: true });
    const tmp = join(dir, `.pi-${session}-${process.pid}`);
    writeFileSync(tmp, JSON.stringify(rec));
    renameSync(tmp, join(dir, `pi-${session}.json`));
    last = rec;
  }

  function on(event: string, handler: (event: any, ctx: ExtensionContext) => void) {
    pi.on(event as any, (e: any, ctx: ExtensionContext) => {
      try {
        handler(e, ctx);
      } catch (err) {
        try {
          appendFileSync(join(root, "errors.log"), `${now()} pi adapter failed on ${event}: ${err}\n`);
        } catch {}
      }
    });
  }

  on("session_start", (_, ctx) => {
    running = false;
    write(ctx, "completed");
  });
  on("agent_start", (_, ctx) => {
    running = true;
    write(ctx, "working");
  });
  on("ui_prompt_start", (e, ctx) => write(ctx, "input-required", e.title ?? e.kind));
  on("ui_prompt_end", (_, ctx) => write(ctx, running ? "working" : "completed"));
  on("agent_settled", (_, ctx) => {
    running = false;
    write(ctx, "completed");
  });
  on("session_info_changed", (_, ctx) => last && write(ctx, last.state, last.reason));
  on("session_shutdown", (_, ctx) => {
    rmSync(join(dir, `pi-${ctx.sessionManager.getSessionId()}.json`), { force: true });
    last = undefined;
  });
}
