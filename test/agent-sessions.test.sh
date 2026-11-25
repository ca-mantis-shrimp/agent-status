# The list puts sessions waiting on you first and skips dead ones.
source "$(dirname "$0")/lib.sh"
mkdir -p "$AGENT_STATUS_DIR/sessions"
put() { jq -nc '{harness: "claude-code"} + $ARGS.named' "$@" >"$AGENT_STATUS_DIR/sessions/$RANDOM.json"; }
put --arg session busy0000 --arg project /p/alpha --arg state working --arg since 2026-11-25T01:00:00Z
put --arg session asks0000 --arg project /p/beta --arg state input-required --arg since 2026-11-25T02:00:00Z --arg reason "permission: Bash"
put --arg session done0000 --arg project /p/gamma --arg state completed --arg since 2026-11-25T00:00:00Z
put --arg session dead0000 --arg project /p/delta --arg state completed --arg since 2026-11-25T00:00:00Z --argjson pid 999999999
echo 'not json' >"$AGENT_STATUS_DIR/sessions/broken.json"

out=$(bin/agent-sessions)
eq "$(awk 'NR > 1 {print $3}' <<<"$out" | paste -sd,)" beta,gamma,alpha "waiting first, then working"
grep -q delta <<<"$out" && fail "a dead pid is skipped"
grep -q 'permission: Bash' <<<"$out" || fail "reason is shown"
put --arg session named000 --arg project /p/epsilon --arg name "Fix the parser" --arg state working --arg since 2026-11-25T03:00:00Z
out=$(bin/agent-sessions)
grep -q 'Fix the parser' <<<"$out" || fail "a name replaces the directory"
grep -q epsilon <<<"$out" && fail "the directory is only the fallback"

rm "$AGENT_STATUS_DIR"/sessions/*
eq "$(bin/agent-sessions)" "" "no sessions prints nothing"
