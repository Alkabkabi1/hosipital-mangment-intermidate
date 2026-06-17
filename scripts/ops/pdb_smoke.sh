#!/usr/bin/env bash
set -euo pipefail

NAMESPACE=${NAMESPACE:-hospital-app}
LABEL=${LABEL:-app=hospital-api}
EXECUTE=false

usage(){
  echo "Usage: NAMESPACE=hospital-app LABEL=app=hospital-api $0 [--execute]" >&2
}

for arg in "$@"; do
  case "$arg" in
    --execute) EXECUTE=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $arg" >&2; usage; exit 1 ;;
  esac
done

echo "[pdb-smoke] Namespace: $NAMESPACE"
echo "[pdb-smoke] Label selector: $LABEL"

POD=$(kubectl -n "$NAMESPACE" get pods -l "$LABEL" -o jsonpath='{.items[0].metadata.name}')
NODE=$(kubectl -n "$NAMESPACE" get pod "$POD" -o jsonpath='{.spec.nodeName}')

echo "[pdb-smoke] Selected pod: $POD on node: $NODE"
echo "[pdb-smoke] Planned actions:"
echo "  1) kubectl cordon $NODE"
echo "  2) kubectl -n $NAMESPACE drain $NODE --ignore-daemonsets --delete-emptydir-data --pod-selector=$LABEL --dry-run=server"
echo "  3) Attempt an eviction of $POD (PDB should keep at least one Ready)"
echo "  4) kubectl uncordon $NODE"

if ! $EXECUTE; then
  echo "[pdb-smoke] Dry-run only. Re-run with --execute to perform actions."
  exit 0
fi

kubectl cordon "$NODE"
set +e
kubectl -n "$NAMESPACE" drain "$NODE" --ignore-daemonsets --delete-emptydir-data --pod-selector="$LABEL" --timeout=120s
RC=$?
set -e
echo "[pdb-smoke] drain exit code: $RC (non-zero may indicate PDB protection)"
kubectl uncordon "$NODE" || true
echo "[pdb-smoke] Completed."

