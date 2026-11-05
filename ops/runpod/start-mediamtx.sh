#!/bin/bash
# Start WOLF MediaMTX after a Runpod boot.
# The network volume keeps this script and mediamtx.yml. The container disk does not.
# Runpod maps public TCP ports onto container ports 1935 (RTMP) and 39909 (WebRTC).
# Those public ports change every reset. MediaMTX must announce the public WebRTC port.

set -u

log() {
  printf '%s\n' "$*"
}

if [[ -x /start.sh ]] && ! pidof sshd >/dev/null 2>&1; then
  nohup /start.sh >/workspace/runpod-start.log 2>&1 &
  disown || true
fi

cd /workspace

for _ in $(seq 1 30); do
  RTMP_PUBLIC="${RUNPOD_TCP_PORT_1935:-}"
  WEBRTC_PUBLIC="${RUNPOD_TCP_PORT_39909:-}"
  if [[ -n "$RTMP_PUBLIC" && -n "$WEBRTC_PUBLIC" ]]; then
    break
  fi
  sleep 1
done

PUBLIC_IP="${RUNPOD_PUBLIC_IP:-38.80.152.147}"
RTMP_PUBLIC="${RUNPOD_TCP_PORT_1935:-}"
WEBRTC_PUBLIC="${RUNPOD_TCP_PORT_39909:-}"

if [[ ! "$RTMP_PUBLIC" =~ ^[0-9]+$ || ! "$WEBRTC_PUBLIC" =~ ^[0-9]+$ ]]; then
  log "MediaMTX start failed. Runpod did not publish the TCP port variables."
  env | grep '^RUNPOD_TCP_PORT_' || true
  exit 1
fi

if ! command -v socat >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y socat
fi

if ! grep -q '^webrtcLocalTCPAddress:' /workspace/mediamtx.yml; then
  log "MediaMTX start failed. /workspace/mediamtx.yml has no webrtcLocalTCPAddress."
  exit 1
fi

sed -i -E "s/^webrtcLocalTCPAddress:.*/webrtcLocalTCPAddress: :${WEBRTC_PUBLIC}/" /workspace/mediamtx.yml

if [[ "$WEBRTC_PUBLIC" != "39909" ]]; then
  if pidof socat >/dev/null 2>&1; then
    pkill -f 'socat TCP-LISTEN:39909' || true
    sleep 0.2
  fi
  socat TCP-LISTEN:39909,fork,reuseaddr,bind=0.0.0.0 "TCP:127.0.0.1:${WEBRTC_PUBLIC}" &
  SOCAT_PID=$!
  sleep 0.3
  if ! kill -0 "$SOCAT_PID" 2>/dev/null; then
    log "MediaMTX start failed. The WebRTC forward from port 39909 did not stay up."
    exit 1
  fi
fi

BRIX_URL="rtmp://${PUBLIC_IP}:${RTMP_PUBLIC}/live"
printf '%s\n' "$BRIX_URL" > /workspace/brix-url.txt
log "BRIX ${BRIX_URL}"
log "BRIX stream key: test"
log "WebRTC public port: ${WEBRTC_PUBLIC}"

exec /workspace/mediamtx /workspace/mediamtx.yml
