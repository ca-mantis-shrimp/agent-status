# Shared by the tests: a scratch status directory and assertions.
set -euo pipefail
AGENT_STATUS_DIR=$(mktemp -d)
export AGENT_STATUS_DIR
unset CLAUDE_PROJECT_DIR
trap 'rm -rf "$AGENT_STATUS_DIR"' EXIT
fail() { echo "  $*" >&2; exit 1; }
eq() { [ "$1" = "$2" ] || fail "expected '$2', got '$1' ($3)"; }
