#!/usr/bin/env bash
set -euo pipefail

NAMESPACE=${NAMESPACE:-hospital-app}
HOST=${HOST:-api.example.com}
WEIGHT=${WEIGHT:-10}
ACTION=${ACTION:-apply} # apply|delete

usage(){
  echo "Usage: NAMESPACE=hospital-app HOST=api.example.com WEIGHT=10 ACTION=apply $0" >&2
}

cat_manifest(){
cat <<YAML
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hospital-api-canary
  namespace: ${NAMESPACE}
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "${WEIGHT}"
spec:
  rules:
    - host: ${HOST}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: hospital-api
                port:
                  number: 3037
YAML
}

echo "[canary] ACTION=$ACTION NAMESPACE=$NAMESPACE HOST=$HOST WEIGHT=$WEIGHT"

if [[ "$ACTION" == "delete" ]]; then
  kubectl -n "$NAMESPACE" delete ingress hospital-api-canary --ignore-not-found
  exit 0
fi

cat_manifest | kubectl apply -f -
echo "[canary] Applied canary ingress"

