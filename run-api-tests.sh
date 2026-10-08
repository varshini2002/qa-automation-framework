#!/bin/bash
# Builds the API server if needed, starts it on port 3000, runs the API tests, then stops the server.

cd "$(dirname "$0")" || exit 1

if [ ! -f api-server/dist/server.js ]; then
  echo "Building API server..."
  (cd api-server && npm run build) || { echo "Build failed!"; exit 1; }
fi

echo "Starting API server on port 3000..."
# exec replaces the subshell, so SERVER_PID is the node server itself
(cd api-server && PORT=3000 exec node dist/server.js) &
SERVER_PID=$!

stop_server() {
  echo "Stopping API server..."
  kill "$SERVER_PID" 2>/dev/null
  wait "$SERVER_PID" 2>/dev/null
}
trap stop_server EXIT

# Wait until the server answers its health check
ready=0
for _ in $(seq 1 30); do
  if curl -sf http://localhost:3000/health > /dev/null; then
    ready=1
    break
  fi
  sleep 0.5
done
if [ "$ready" -ne 1 ]; then
  echo "API server did not become ready on port 3000"
  exit 1
fi

echo "Running API tests..."
npm run test:api
TEST_EXIT=$?

echo "Test run complete!"
exit $TEST_EXIT
