#!/usr/bin/env bash
set -euo pipefail

IMAGE=""
NAMESPACE="hospital-app"

usage() {
  echo "Usage: $0 --image=<ref> [--namespace=<ns>]" >&2
}

for arg in "$@"; do
  case "$arg" in
    --image=*) IMAGE="${arg#*=}" ;;
    --namespace=*) NAMESPACE="${arg#*=}" ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $arg" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$IMAGE" ]]; then
  echo "--image is required" >&2
  usage
  exit 1
fi

echo "[rollout] Applying manifests to namespace: $NAMESPACE"
kubectl apply -f deploy/k8s/namespace.yaml
kubectl -n "$NAMESPACE" apply -f deploy/k8s/configmap-env.yaml
kubectl -n "$NAMESPACE" apply -f deploy/k8s/secret-env.yaml
kubectl -n "$NAMESPACE" apply -f deploy/k8s/service.yaml
kubectl -n "$NAMESPACE" apply -f deploy/k8s/deployment.yaml

echo "[rollout] Setting image: $IMAGE"
kubectl -n "$NAMESPACE" set image deployment/hospital-api api="$IMAGE" --record

echo "[rollout] Waiting for rollout..."
kubectl -n "$NAMESPACE" rollout status deployment/hospital-api --timeout=180s

echo "[rollout] Done."

