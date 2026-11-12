#!/usr/bin/env bash
set -eo pipefail

ENGINE="k3s"
CLUSTER_NAME="iris-local"
NAMESPACE="pcpi"
SKIP_BUILD=false
LOCAL_KUBECONFIG="/etc/rancher/k3s/k3s.yaml"
PUBLIC_URL="${PUBLIC_URL:-}"
NODE_ENV="${NODE_ENV:-}"
LOG_CONTAINER=""
LOG_TAIL="100"
LOG_FOLLOW=true

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
K8S_DIR="$FRONTEND_DIR/k8s"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}  $1${NC}"; }
log_success() { echo -e "${GREEN}  $1${NC}"; }
log_warn()    { echo -e "${YELLOW}  $1${NC}"; }
log_error()   { echo -e "${RED}  $1${NC}"; }

configure_public_url() {
  PUBLIC_URL="${PUBLIC_URL:-http://localhost}"
  PUBLIC_URL="${PUBLIC_URL%/}"
  local origin_pattern='^https?://([A-Za-z0-9][A-Za-z0-9.-]*|\[[A-Fa-f0-9:]+\])(:([0-9]{1,5}))?$'
  if [[ ! "$PUBLIC_URL" =~ $origin_pattern ]]; then
    log_error "--public-url debe ser un origen HTTP/HTTPS sin ruta, usuario ni parámetros."
    return 1
  fi
  local port="${BASH_REMATCH[3]}"
  if [[ -n "$port" ]] && ((10#$port == 0 || 10#$port > 65535)); then
    log_error "El puerto de --public-url no es válido."
    return 1
  fi
}

validate_config() {
  local validation_errors=()

  if [[ ! -f "$K8S_DIR/configmap.yaml" ]]; then
    validation_errors+=("No se encontró $K8S_DIR/configmap.yaml.")
  elif ! kubectl patch --local --type merge -f "$K8S_DIR/configmap.yaml" -p '{}' -o name > /dev/null 2>&1; then
    validation_errors+=("[frontend-config] El archivo $K8S_DIR/configmap.yaml no tiene formato YAML válido.")
  fi

  if [[ ! -f "$K8S_DIR/frontend.yaml" ]]; then
    validation_errors+=("No se encontró $K8S_DIR/frontend.yaml.")
  elif ! kubectl patch --local --type merge -f "$K8S_DIR/frontend.yaml" -p '{}' -o name > /dev/null 2>&1; then
    validation_errors+=("[frontend] El archivo $K8S_DIR/frontend.yaml no tiene formato YAML válido.")
  fi

  if (( ${#validation_errors[@]} > 0 )); then
    echo ""
    log_error "Se encontraron ${#validation_errors[@]} error(es) en la configuración de Frontend:"
    for err in "${validation_errors[@]}"; do
      echo -e "   • $err"
    done
    return 1
  fi

  log_success "Configuración de Frontend K8s válida."
}

ensure_cluster() {
  case "$ENGINE" in
    kind|k3d) mkdir -p "$(dirname "$LOCAL_KUBECONFIG")" ;;
  esac

  case "$ENGINE" in
    kind)
      local clusters
      clusters=$(kind get clusters)
      if ! grep -Fx -- "$CLUSTER_NAME" <<< "$clusters" > /dev/null; then
        log_info "Creando clúster Kind '$CLUSTER_NAME'..."
        kind create cluster --name "$CLUSTER_NAME" --kubeconfig "$LOCAL_KUBECONFIG"
      fi
      kind export kubeconfig --name "$CLUSTER_NAME" --kubeconfig "$LOCAL_KUBECONFIG"
      ;;
    k3s)
      if ! systemctl is-active --quiet k3s.service; then
        log_warn "El servicio k3s no está activo. Iniciando..."
        sudo systemctl start k3s.service
      fi
      ;;
    k3d)
      local k3d_clusters
      k3d_clusters=$(k3d cluster list --no-headers | awk '{print $1}')
      if ! grep -Fx -- "$CLUSTER_NAME" <<< "$k3d_clusters" > /dev/null; then
        log_info "Creando clúster K3d '$CLUSTER_NAME'..."
        k3d cluster create "$CLUSTER_NAME"
      fi
      k3d kubeconfig merge "$CLUSTER_NAME" --kubeconfig-switch-context --kubeconfig-merge-default
      ;;
  esac
}

ensure_namespace() {
  if ! "${KUBECTL_COMMAND[@]}" get namespace "$NAMESPACE" >/dev/null 2>&1; then
    log_info "Creando namespace '$NAMESPACE'..."
    "${KUBECTL_COMMAND[@]}" create namespace "$NAMESPACE"
  fi
}

build_images() {
  log_info "Compilando Frontend (Producción)..."
  docker build \
    --build-arg API_URL="http://gateway:3000" \
    --build-arg NEXT_PUBLIC_URL="$PUBLIC_URL" \
    --build-arg NEXT_PUBLIC_ENABLE_API_MOCKING="false" \
    -t "pcpi/frontend:latest" \
    -f "$FRONTEND_DIR/Dockerfile" \
    "$FRONTEND_DIR"

  log_success "Imagen pcpi/frontend:latest compilada con éxito."
}

load_images() {
  local image="pcpi/frontend:latest"
  local workers=(
    "root@hyas"
    "root@maia"
  )

  log_info "Cargando imagen frontend en el clúster ($ENGINE)..."

  log_info "Importando frontend en Atlas..."

  docker save "$image" | sudo k3s ctr --namespace k8s.io images import -

  for worker in "${workers[@]}"; do
    log_info "Importando frontend en $worker..."

    docker save "$image" | ssh "$worker" "sudo k3s ctr --namespace k8s.io images import -"
  done

  log_success "Frontend distribuido en Atlas"
}

deploy_app() {
  ensure_namespace
  log_info "Desplegando configuración de Frontend..."

  local patch_data="\"NEXT_PUBLIC_URL\":\"$PUBLIC_URL\",\"API_URL\":\"http://gateway:3000\",\"NEXT_PUBLIC_ENABLE_API_MOCKING\":\"false\""
  if [[ -n "$NODE_ENV" ]]; then
    patch_data="$patch_data,\"NODE_ENV\":\"$NODE_ENV\""
  fi

  kubectl patch --local --type merge -f "$K8S_DIR/configmap.yaml" \
    -p "{\"data\":{$patch_data}}" \
    -o yaml | "${KUBECTL_COMMAND[@]}" apply -f -

  log_info "Desplegando Deployment y Service de Frontend..."
  "${KUBECTL_COMMAND[@]}" apply -f "$K8S_DIR/frontend.yaml"

  log_info "Actualizando pod de Frontend..."
  "${KUBECTL_COMMAND[@]}" rollout restart deployment/frontend -n "$NAMESPACE"

  if ! "${KUBECTL_COMMAND[@]}" rollout status deployment/frontend -n "$NAMESPACE" --timeout=180s; then
    log_error "Falló el despliegue de frontend."
    "${KUBECTL_COMMAND[@]}" get pods -n "$NAMESPACE" -l app=frontend
    "${KUBECTL_COMMAND[@]}" logs -n "$NAMESPACE" -l app=frontend --all-containers=true --tail=50 || true
    "${KUBECTL_COMMAND[@]}" describe pod -n "$NAMESPACE" -l app=frontend | tail -n 25 || true
    exit 1
  fi

  log_success "Frontend desplegado y saludable."
}

show_logs() {
  local container="$LOG_CONTAINER"
  local tail_lines="${LOG_TAIL:-100}"
  local follow_flags=()

  if [ "$LOG_FOLLOW" = true ]; then
    follow_flags+=("-f")
  fi

  log_info "Consultando logs de Frontend en namespace '$NAMESPACE' (tail: $tail_lines)..."

  local container_args=()
  if [[ -n "$container" ]]; then
    container_args=("-c" "$container")
  else
    container_args=("--all-containers=true")
  fi

  "${KUBECTL_COMMAND[@]}" logs -n "$NAMESPACE" -l app=frontend "${container_args[@]}" --tail="$tail_lines" "${follow_flags[@]}"
}

status() {
  echo "=== Pods Frontend en $NAMESPACE ==="
  "${KUBECTL_COMMAND[@]}" get pods -n "$NAMESPACE" -l app=frontend -o wide
  echo ""
  echo "=== Servicio Frontend en $NAMESPACE ==="
  "${KUBECTL_COMMAND[@]}" get svc -n "$NAMESPACE" frontend --ignore-not-found=true
}

clean_app() {
  log_warn "Eliminando Frontend de namespace '$NAMESPACE'..."
  "${KUBECTL_COMMAND[@]}" delete -f "$K8S_DIR/frontend.yaml" --ignore-not-found=true
  "${KUBECTL_COMMAND[@]}" delete -f "$K8S_DIR/configmap.yaml" --ignore-not-found=true
  log_success "Frontend eliminado."
}

show_help() {
  cat << EOF
Uso: $(basename "$0") <COMANDO> [OPCIONES]

Comandos disponibles:
  check      Valida los manifiestos YAML de frontend
  up         Ejecuta el flujo completo (build, load, deploy)
  build      Solo compila la imagen Docker de producción de frontend
  load       Solo carga la imagen compilada en el motor seleccionado
  deploy     Aplica los manifiestos de frontend y reinicia el deployment
  status     Muestra el estado de pods y servicios de frontend
  logs       Muestra logs de frontend
  down       Elimina el deployment y servicio de frontend

Opciones / Parámetros:
  --skip-build             Salta la compilación si ya tienes la imagen lista
  --engine <motor>         Motor: kind, k3s o k3d (Default: $ENGINE)
  --cluster <nombre>       Nombre del clúster Kind/K3d (Default: iris-local)
  --public-url <url>       URL pública del frontend (Default: http://localhost)
  --node-env <ambiente>    Entorno de ejecución: production o development
  -c, --container <nombre> Nombre del contenedor
  --tail <líneas>          Número de líneas a mostrar (Default: 100)
  -f, --follow             Sigue los logs en tiempo real (Default: true)
  --no-follow              Muestra las líneas solicitadas y termina (sin -f)
  -h, --help               Muestra este mensaje de ayuda

Ejemplos:
  $(basename "$0") check
  $(basename "$0") up --engine k3s
  $(basename "$0") up --engine k3s --public-url https://iris.tu-dominio.com
  $(basename "$0") deploy --skip-build
  $(basename "$0") logs --tail 200
EOF
}

ACTION="${1:-}"

if [[ "$ACTION" == "-h" || "$ACTION" == "--help" || "$ACTION" == "help" || -z "$ACTION" ]]; then
  show_help
  exit 0
fi

shift || true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --engine|--cluster|--public-url|--node-env|--env|--tail|-c|--container)
      if [[ $# -lt 2 || -z "$2" || "$2" == --* ]]; then
        log_error "La opción $1 requiere un valor."
        exit 1
      fi
      ;;
  esac

  case "$1" in
    --skip-build)     SKIP_BUILD=true; shift ;;
    --engine)         ENGINE="$2"; shift 2 ;;
    --cluster)        CLUSTER_NAME="$2"; shift 2 ;;
    --public-url)     PUBLIC_URL="$2"; shift 2 ;;
    --node-env|--env) NODE_ENV="$2"; shift 2 ;;
    --tail)           LOG_TAIL="$2"; shift 2 ;;
    -c|--container)   LOG_CONTAINER="$2"; shift 2 ;;
    -f|--follow)      LOG_FOLLOW=true; shift ;;
    --no-follow)      LOG_FOLLOW=false; shift ;;
    -h|--help)        show_help; exit 0 ;;
    *)                log_error "Opción desconocida: $1"; show_help; exit 1 ;;
  esac
done

case "$ENGINE" in
  kind|k3d)
    export KUBECONFIG="$LOCAL_KUBECONFIG"
    KUBECTL_COMMAND=(kubectl --kubeconfig "$LOCAL_KUBECONFIG" --context "$ENGINE-$CLUSTER_NAME")
    ;;
  k3s)  KUBECTL_COMMAND=(sudo k3s kubectl --kubeconfig /etc/rancher/k3s/k3s.yaml) ;;
  *) log_error "Motor no soportado: $ENGINE. Usa 'kind', 'k3s' o 'k3d'."; exit 1 ;;
esac

case "$ACTION" in
  up|build|deploy|check)
    configure_public_url
    ;;
esac

case "$ACTION" in
  check)  validate_config ;;
  up)
    validate_config
    ensure_cluster
    if [ "$SKIP_BUILD" = false ]; then
      build_images
    fi
    load_images
    deploy_app
    status
    echo ""
    log_success "Despliegue de Frontend completado con éxito."
    base_url="${PUBLIC_URL:-http://localhost}"
    log_info "Frontend: ${base_url%/}"
    ;;
  build)
    validate_config || exit 1
    build_images
    ;;
  load)   load_images ;;
  deploy)
    validate_config
    deploy_app
    ;;
  status) status ;;
  logs)   show_logs ;;
  down)   clean_app ;;
  *)      show_help; exit 1 ;;
esac
