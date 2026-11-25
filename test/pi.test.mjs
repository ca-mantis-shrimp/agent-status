// Drives the pi adapter with a fake pi: no model, no tokens.
import { readFileSync, existsSync } from "node:fs";
const dir = process.env.AGENT_STATUS_DIR + "/sessions";
const { default: adapter } = await import(process.argv[2]);
const handlers = {};
let name;
adapter({ on: (e, h) => (handlers[e] = h), getSessionName: () => name });
const ctx = { cwd: "/p/demo", sessionManager: { getSessionId: () => "s1" } };
const send = (e, ev = {}) => handlers[e]({ type: e, ...ev }, ctx);
const rec = () => JSON.parse(readFileSync(dir + "/pi-s1.json", "utf8"));
const eq = (got, want, what) => { if (got !== want) { console.error(`  expected '${want}', got '${got}' (${what})`); process.exit(1); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

send("session_start", { reason: "startup" }); eq(rec().state, "completed", "a new session waits for you");
eq(rec().project, "/p/demo", "project comes from cwd"); eq(rec().pid, process.pid, "pid is pi's");
send("agent_start"); eq(rec().state, "working", "a run starts a turn");
const since = rec().since; await sleep(1100);
send("agent_start"); eq(rec().since, since, "same state keeps since");
send("ui_prompt_start", { kind: "select", title: "Allow rm -rf?" }); eq(rec().state, "input-required", "a prompt waits for you");
eq(rec().reason, "Allow rm -rf?", "the prompt's title is the reason");
send("ui_prompt_end", { kind: "select" }); eq(rec().state, "working", "an answer resumes the run");
eq(rec().reason, undefined, "the reason goes with the prompt");
name = "Fix the parser"; send("session_info_changed", { name }); eq(rec().name, "Fix the parser", "a name is written at once");
eq(rec().state, "working", "naming keeps the state");
send("agent_settled", { aborted: false }); eq(rec().state, "completed", "a settled run waits for you");
send("ui_prompt_start", { kind: "confirm" }); send("ui_prompt_end", { kind: "confirm" });
eq(rec().state, "completed", "a prompt outside a run goes back to waiting");
send("session_shutdown", { reason: "quit" }); eq(existsSync(dir + "/pi-s1.json"), false, "an ended session leaves no record");
