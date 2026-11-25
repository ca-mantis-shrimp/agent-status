# The Claude Code adapter maps hook events to states.
source "$(dirname "$0")/lib.sh"
hook=adapters/claude-code/hook
rec=$AGENT_STATUS_DIR/sessions/claude-code-s1.json
send() { jq -nc --arg e "$1" '{session_id: "s1", cwd: "/p/demo", hook_event_name: $e} + $ARGS.named' "${@:2}" | $hook; }
state() { jq -r .state "$rec"; }

send SessionStart;                                   eq "$(state)" completed "a new session waits for you"
eq "$(jq -r .project "$rec")" /p/demo "project comes from cwd"
send UserPromptSubmit;                               eq "$(state)" working "a prompt starts a turn"
since=$(jq -r .since "$rec"); sleep 1
send PreToolUse --arg tool_name Bash;                eq "$(jq -r .since "$rec")" "$since" "same state keeps since"
send PreToolUse --arg tool_name AskUserQuestion;     eq "$(state)" input-required "a question waits for you"
eq "$(jq -r .reason "$rec")" question "question reason"
send PostToolUse --arg tool_name AskUserQuestion;    eq "$(state)" working "an answer resumes the turn"
send PermissionRequest --arg tool_name Bash;         eq "$(jq -r .reason "$rec")" "permission: Bash" "permission reason"
send Notification --arg notification_type idle_prompt; eq "$(state)" input-required "idle notices change nothing"
send Stop;                                           eq "$(state)" completed "a finished turn waits for you"
send SessionEnd;                                     [ ! -e "$rec" ] || fail "an ended session leaves no record"

echo 'not json' | $hook || fail "bad input must not fail the harness"
grep -q 'hook failed' "$AGENT_STATUS_DIR/errors.log" || fail "bad input is logged"
