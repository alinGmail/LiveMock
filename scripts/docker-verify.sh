#!/usr/bin/env bash
#
# End-to-end verification for the Docker image built from the root Dockerfile.
#
# Builds `livemock:test` (unless the image already exists), starts it with a
# throwaway data volume on ports that do not collide with `yarn web-dev`
# (19002 / 18088 instead of 9002 / 8088), then asserts that the packaged server
# really serves the dashboard, enforces auth, runs a project and answers a
# mocked request on the project port. Container and volume are removed on exit
# unless KEEP=1.
#
# Usage:
#   yarn docker:verify                    # bash scripts/docker-verify.sh
#   FORCE=1 yarn docker:verify            # rebuild the image first
#   KEEP=1  yarn docker:verify            # keep container + volume for debugging
#
# Env overrides: IMAGE CT VOL APP_PORT MOCK_PORT USER_NAME PASSWORD FORCE KEEP
#
# Requires: docker reachable without sudo, curl, jq.
#
# NOTE: deliberately not `set -e`. A failing assertion must not hide the rest,
# so every section runs and the summary reports the total.
set -uo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO=${REPO:-$(cd "$SCRIPT_DIR/.." && pwd)}

IMAGE=${IMAGE:-livemock:test}
CT=${CT:-livemock-verify}
VOL=${VOL:-livemock_verify_data}
APP_PORT=${APP_PORT:-19002}     # host port mapped to the dashboard/API (container 9002)
MOCK_PORT=${MOCK_PORT:-18088}   # host port mapped to the project mock listener
USER_NAME=${USER_NAME:-verify}
PASSWORD=${PASSWORD:-verify-pass-2026}

LABEL_KEY=livemock.verify
BASE="http://localhost:$APP_PORT"
JAR=$(mktemp)
EXP_OUT=$(mktemp)

usage() { awk 'NR>1 && /^#/ {sub(/^# ?/, ""); print; next} NR>1 {exit}' "${BASH_SOURCE[0]}"; }

case "${1:-}" in
  -h|--help) usage; exit 0 ;;
esac

c() { if [ -t 1 ]; then printf '\033[%sm%s\033[0m' "$1" "$2"; else printf '%s' "$2"; fi; }
sec() { echo; echo "$(c '1;36' "== $*")"; }
PASS=0; FAIL=0
ok() { echo "  $(c '32' PASS) $*"; PASS=$((PASS+1)); }
no() { echo "  $(c '31' FAIL) $*"; [ -n "${2:-}" ] && echo "       $2"; FAIL=$((FAIL+1)); }
eq() { if [ "$2" = "$3" ]; then ok "$1 ($3)"; else no "$1" "expected [$2] got [$3]"; fi; }
have() { if printf '%s' "$2" | grep -q -- "$3"; then ok "$1"; else no "$1" "missing [$3] in: $(printf '%s' "$2" | head -c 300)"; fi; }
new_id() {
  if [ -r /proc/sys/kernel/random/uuid ]; then
    cat /proc/sys/kernel/random/uuid
  else
    printf '%s-%s-%s' "$(date +%s)" "$$" "$RANDOM"
  fi
}

STARTED=0
die() {
  echo; echo "$(c '1;31' "ABORT: $*")"
  [ "$STARTED" = 1 ] && echo "  (rerun with KEEP=1 to keep the container for inspection)"
  exit 1
}

cleanup() {
  if [ "${KEEP:-0}" = 1 ]; then
    echo; echo "KEEP=1 -> container '$CT' and volume '$VOL' left in place."
    echo "          inspect with: docker exec -it $CT sh"
    echo "          remove with:  docker rm -f $CT && docker volume rm $VOL"
  else
    own_container && docker rm -f "$CT" >/dev/null 2>&1
    docker volume rm "$VOL" >/dev/null 2>&1
  fi
  rm -f "$JAR" "$EXP_OUT"
}
trap cleanup EXIT

# Only ever delete a container this script created.
own_container() {
  [ "$(docker inspect -f "{{ index .Config.Labels \"$LABEL_KEY\" }}" "$CT" 2>/dev/null)" = "1" ]
}

remove_container() {
  if own_container; then
    docker rm -f "$CT" >/dev/null 2>&1
  elif docker ps -a --format '{{.Names}}' | grep -qx "$CT"; then
    die "a container named '$CT' already exists and was not created by this script; remove it or set CT=<other>"
  fi
}

sec "0. prerequisites"
[ -d "$REPO" ] || die "repo not found: $REPO"
[ -f "$REPO/Dockerfile" ] || die "no Dockerfile at $REPO"
command -v docker >/dev/null || die "docker not installed"
command -v curl >/dev/null || die "curl not installed"
command -v jq >/dev/null || die "jq not installed (needed to build/parse the API payloads)"
docker info --format '{{.ServerVersion}}' >/dev/null 2>&1 \
  || die "cannot reach the docker daemon (not in the docker group? try: newgrp docker)"
ok "docker daemon reachable ($(docker info --format '{{.ServerVersion}}'))"
cd "$REPO" || die "cannot cd $REPO"

sec "1. build image $IMAGE"
if [ "${FORCE:-0}" != 1 ] && docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "  image already exists, skipping build (FORCE=1 to rebuild)"
else
  START=$(date +%s)
  docker build -t "$IMAGE" . || die "docker build failed"
  echo "  build took $(( $(date +%s) - START ))s"
fi
SIZE=$(docker image inspect "$IMAGE" --format '{{.Size}}' | awk '{printf "%.0f MB", $1/1048576}')
ok "image size $SIZE"

sec "2. start container"
remove_container
# A volume left behind by an earlier KEEP=1 run already holds an account, which
# would make the registration check below fail for the wrong reason.
if docker volume inspect "$VOL" >/dev/null 2>&1; then
  echo "  removing stale volume '$VOL' from an earlier run"
  docker volume rm "$VOL" >/dev/null 2>&1
fi
docker volume create "$VOL" >/dev/null
docker run -d --name "$CT" --label "$LABEL_KEY=1" \
  -p "$APP_PORT":9002 -p "$MOCK_PORT":"$MOCK_PORT" \
  -v "$VOL":/app/data \
  "$IMAGE" >/dev/null || die "docker run failed"
STARTED=1
have "container is running" "$(docker ps --filter "name=$CT" --format '{{.Status}}')" "Up"

sec "3. startup + UI"
CODE=000
for _ in $(seq 1 60); do
  # express.static answers /dashboard with 301 -> /dashboard/, so follow redirects
  # both here and in the assertions below.
  CODE=$(curl -sL -o /dev/null -w '%{http_code}' "$BASE/dashboard" || true)
  [ "$CODE" = 200 ] && break
  sleep 1
done
eq "GET /dashboard (following redirect)" "200" "$CODE"
if [ "$CODE" != 200 ]; then
  echo "  --- docker logs (tail) ---"
  docker logs "$CT" 2>&1 | tail -25
  die "dashboard never became ready"
fi
eq "GET /dashboard/" "200" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/dashboard/")"
eq "GET /" "302" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")"
eq "GET / -> Location" "/dashboard" "$(curl -s -o /dev/null -w '%{redirect_url}' "$BASE/" | sed 's|.*'"$APP_PORT"'||')"
eq "GET /api/project unauthenticated" "401" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/project")"
have "frontend assets present" "$(docker exec "$CT" ls /app/dist/dashboard 2>&1)" "index.html"

sec "4. runtime identity + volume permissions"
eq "runs as uid" "1000" "$(docker exec "$CT" id -u)"
eq "runs as user" "node" "$(docker exec "$CT" id -un)"
eq "/app/data owner" "node" "$(docker exec "$CT" sh -c 'ls -ld /app/data | awk "{print \$3}"')"
eq "/app/data writable" "ok" "$(docker exec "$CT" sh -c 'touch /app/data/.wtest && echo ok && rm -f /app/data/.wtest' 2>&1 | tail -1)"

sec "5. auth: first-run registration"
BODY=$(curl -s -c "$JAR" -H 'content-type: application/json' \
  -d "{\"username\":\"$USER_NAME\",\"password\":\"$PASSWORD\"}" "$BASE/api/auth/register")
have "register created account" "$BODY" "$USER_NAME"
eq "GET /api/project with session" "200" "$(curl -s -b "$JAR" -o /dev/null -w '%{http_code}' "$BASE/api/project")"
eq "re-register is closed" "403" "$(curl -s -o /dev/null -w '%{http_code}' -H 'content-type: application/json' \
  -d '{"username":"x","password":"yyyyyyyy"}' "$BASE/api/auth/register")"

sec "6. create + start project on port $MOCK_PORT"
PID=$(curl -s -b "$JAR" -H 'content-type: application/json' -d "{\"project\":{
  \"id\":\"$(new_id)\",\"name\":\"docker-verify\",\"description\":\"\",\"port\":\"$MOCK_PORT\",
  \"error\":false,\"errorMessage\":null,\"status\":\"STOPPED\",
  \"unclosedWebsocketRequestLogIds\":[],\"maxRequestLogNumber\":5000,
  \"createDate\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}}" "$BASE/api/project/" | jq -r '.id // empty')
[ -n "$PID" ] || die "project creation returned no id"
ok "project id $PID"
eq "POST /api/project/start" "200" "$(curl -s -b "$JAR" -o /dev/null -w '%{http_code}' -X POST "$BASE/api/project/start/$PID")"
sleep 2

# The payload mirrors core/struct/{params/ExpectationParams,expectation,matcher,action}.ts.
# If those structs change, this is expected to break loudly at the request below.
sec "7. mock expectation + real request"
EXP=$(jq -n --arg pid "$PID" --arg eid "$(new_id)" '{
  projectId: $pid,
  expectation: {
    id: $eid ,
    name: "docker-verify hello",
    description: "",
    delay: 0,
    priority: 0,
    activate: true,
    groupId: null,
    createTime: (now|todate),
    matchers: [
      {id:"m1", type:"method", conditions:"IS", value:"GET"},
      {id:"m2", type:"path",   conditions:"IS", value:"/api/hello"}
    ],
    actions: [
      {id:"a1", type:"CUSTOM_RESPONSE", status:200,
       responseContent:{type:"JSON", value:"{\"ok\":true,\"from\":\"docker\"}", headers:[["x-source","livemock-docker"]], contentHandler:"NONE"}}
    ]
  }}' )
CODE=$(curl -s -b "$JAR" -o "$EXP_OUT" -w '%{http_code}' \
  -H 'content-type: application/json' -d "$EXP" "$BASE/api/expectation/")
eq "POST /api/expectation/" "200" "$CODE"
[ "$CODE" = 200 ] || echo "       response: $(head -c 300 "$EXP_OUT")"
sleep 1
RESP=$(curl -s -w '\n%{http_code}' "http://localhost:$MOCK_PORT/api/hello")
MOCK_CODE=$(printf '%s' "$RESP" | tail -1)
MOCK_BODY=$(printf '%s' "$RESP" | sed '$d')
eq "mock listener HTTP status" "200" "$MOCK_CODE"
have "mock listener body" "$MOCK_BODY" '"ok":true'

sec "8. logs recorded + restart persistence"
sleep 1
have "request log captured" "$(curl -s -b "$JAR" "$BASE/api/log/?projectId=$PID")" "/api/hello"
docker restart "$CT" >/dev/null || no "docker restart"
for _ in $(seq 1 45); do
  [ "$(curl -sL -o /dev/null -w '%{http_code}' "$BASE/dashboard" || true)" = 200 ] && break
  sleep 1
done
eq "dashboard after restart" "200" "$(curl -sL -o /dev/null -w '%{http_code}' "$BASE/dashboard")"
eq "session survives restart" "200" "$(curl -s -b "$JAR" -o /dev/null -w '%{http_code}' "$BASE/api/project")"
have "data persisted in volume" "$(docker exec "$CT" ls /app/data 2>&1)" "db"
eq "/app/data still writable after restart" "ok" "$(docker exec "$CT" sh -c 'touch /app/data/.w2 && echo ok && rm -f /app/data/.w2' 2>&1 | tail -1)"

sec "summary"
echo "  image : $IMAGE ($SIZE)"
echo "  passed: $(c '32' "$PASS")   failed: $(c "$( [ "$FAIL" -eq 0 ] && echo 32 || echo 31)" "$FAIL")"
if [ "$FAIL" -ne 0 ]; then
  echo "  container logs (tail 40):"
  docker logs "$CT" 2>&1 | tail -40
  exit 1
fi
echo "  $(c '1;32' 'ALL GREEN')"
