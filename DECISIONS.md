# Decisions

## 1. Status is its own project (2026-11-25, Darrion)

Several harnesses produce status and several places show it (a list, a statusline, the sandbox view), so the
record format lives apart from any one of them. agent-sandbox's `agent-status` becomes one adapter, not the home.

## 2. Build our own rather than adopt paulvandermeijs/agent-status (2026-11-25, Darrion)

That project has the right shape (no daemon, one file per session, hooks for Claude Code and pi) but shows its
format by example rather than as a contract, keeps adapters inside the crate, and reads only from tmux. We borrow
its layout. We share its format only if that ever makes sense.

## 3. State names come from A2A (2026-11-25, facilitator)

A2A is a network protocol between remote agents and doesn't cover watching a local session, but its task states are
the nearest standard vocabulary. Using its names costs nothing and keeps a later bridge simple.

## 4. Readers show, they don't interrupt (2026-11-25, Darrion)

A session waiting on you shows quietly in a reader; no reader sends a notification, bell or sound, not even for
`input-required`. Engaging with a session is a decision you make by looking, and toggling a view is enough. Be
disciplined about notifications.
