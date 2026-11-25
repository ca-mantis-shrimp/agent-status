# The pi adapter maps pi's lifecycle events to states.
source "$(dirname "$0")/lib.sh"
node test/pi.test.mjs "$PWD/adapters/pi/agent-status.ts"
