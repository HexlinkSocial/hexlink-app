#!/bin/bash
set -e

echo "[sam-start] Fixing docker socket permissions..."
sudo chmod 666 /var/run/docker.sock

echo "[sam-start] Waiting for workspace to be ready..."
sleep 10

echo "[sam-start] Checking sam..."
which sam || { echo "sam not found in PATH"; exit 1; }

echo "[sam-start] Checking built lambda files..."
ls /workspace/backend/dist/lambda/ || { echo "dist/lambda not found - run npm run build in backend/"; exit 1; }

echo "[sam-start] Starting SAM local API on port 4000..."
sam local start-api \
  --template template.yaml \
  --port 4000 \
  --host 0.0.0.0 \
  --docker-network sam-app-network \
  --env-vars backend/sam-env.json \
  --docker-volume-basedir "/c/Hexlink/hexlink-app" \
  --container-host host.docker.internal \

echo "[sam-start] SAM started with PID $!"