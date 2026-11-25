# agent-status

Which agent sessions on this machine are working, and which are waiting on you.

Status is a directory of small records. **Adapters**, one per harness, write them. **Readers** (a list, a
statusline, a sandbox view) read them. Neither knows about the other: the record is the whole interface.

## The record

One JSON file per session:

    ${XDG_RUNTIME_DIR:-/run/user/$UID}/agent-status/sessions/<harness>-<session>.json

| field     | required | meaning                                                                 |
|-----------|----------|-------------------------------------------------------------------------|
| `harness` | yes      | lowercase-hyphenated harness name, e.g. `claude-code`                   |
| `session` | yes      | the harness's own session id                                            |
| `project` | yes      | absolute path of the session's working directory                       |
| `state`   | yes      | one of the states below                                                 |
| `since`   | yes      | when the state began, RFC 3339 in UTC                                   |
| `reason`  | no       | short human-readable detail, e.g. which tool wants permission           |
| `pid`     | no       | the harness process; readers drop the record once it is dead            |

States borrow the names of [A2A](https://a2a-protocol.org/latest/specification/)'s task states, with a session's
turn in the place of an A2A task:

| state            | meaning                                                         | waiting on you |
|------------------|-----------------------------------------------------------------|----------------|
| `working`        | a turn is running                                               | no             |
| `input-required` | the turn is blocked on you: a permission prompt or a question   | yes            |
| `completed`      | no turn is running; the agent waits for your next message        | yes            |

Rules:

- A writer writes only its own session's file, and atomically (write a temporary file, then rename).
- A session that ends deletes its file.
- Readers ignore fields they don't know and files they can't parse.
- New optional fields and new states may be added. Changing what an existing field or state means is not allowed.

## Adapters

- [`adapters/claude-code`](adapters/claude-code): Claude Code hooks.

## Readers

- [`bin/agent-sessions`](bin/agent-sessions): one line per session, those waiting on you first.

The list is `agent-sessions`, not `agent-status`, because agent-sandbox already puts an `agent-status` command on
the PATH.

## Tests

    test/run
