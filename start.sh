#!/bin/sh
# Railway startup script
export PORT=${PORT:-4173}
echo "Starting on port $PORT"
npx vite preview --port $PORT --host 0.0.0.0
