#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-pcpi}"
SKIP_BUILD=false
LOCAL_ONLY=false
K3S_SSH_USER="${K3S_SSH_USER:-}"
PUBLIC_URL_EXPLICIT=false
if [[ -n "${PUBLIC_URL:-}" ]]; then
  PUBLIC_URL_EXPLICIT=true
fi
PUBLIC_URL="${PUBLIC_URL:-}"
NODE_ENV="${NODE_ENV:-}"
LOG_APP=""
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

SUDO_CMD=()
if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  SUDO_CMD=(sudo)
fi

KUBECTL_COMMAND=()
NEEDS_SUDO_FOR_KUBECTL=false

kubectl_local() {
  if command -v kubectl >/dev/null 2>&1; then
    KUBECONFIG=/dev/null kubectl "$@"
  elif command -v k3s >/dev/null 2>&1; then
    k3s kubectl --kubeconfig /dev/null "$@"
  else
    log_error "No se encontró 'k3s' ni 'kubectl' para validar o transformar manifiestos YAML."
    return 1
  fi
}

setup_k3s_kubectl() {
  if [[ -n "${KUBECONFIG:-}" && -r "$KUBECONFIG" ]]; then
    KUBECTL_COMMAND=(k3s kubectl --kubeconfig "$KUBECONFIG")
  elif [[ -r "$HOME/.kube/config" ]]; then
    KUBECTL_COMMAND=(k3s kubectl --kubeconfig "$HOME/.kube/config")
  elif [[ -r "/etc/rancher/k3s/k3s.yaml" ]]; then
    KUBECTL_COMMAND=(k3s kubectl --kubeconfig /etc/rancher/k3s/k3s.yaml)
  elif (( ${#SUDO_CMD[@]} > 0 )); then
    NEEDS_SUDO_FOR_KUBECTL=true
    KUBECTL_COMMAND=("${SUDO_CMD[@]}" k3s kubectl --kubeconfig /etc/rancher/k3s/k3s.yaml)
  else
    KUBECTL_COMMAND=(k3s kubectl --kubeconfig /etc/rancher/k3s/k3s.yaml)
  fi
}

require_cmd() {
  local cmd="$1"
  local hint="${2:-}"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log_error "Dependencia requerida no encontrada: '$cmd'.${hint:+ $hint}"
    exit 1
  fi
}

preflight_checks() {
  local action="$1"

  case "$action" in
    check)
      if ! command -v k3s >/dev/null 2>&1 && ! command -v kubectl >/dev/null 2>&1; then
        log_error "Se requiere 'k3s' o 'kubectl' para validar los manifiestos."
        exit 1
      fi
      ;;
    build)
      if ! command -v k3s >/dev/null 2>&1 && ! command -v kubectl >/dev/null 2>&1; then
        log_error "Se requiere 'k3s' o 'kubectl' para validar los manifiestos."
        exit 1
      fi
      require_cmd docker "Instala Docker Engine para compilar la imagen."
      if ! docker info >/dev/null 2>&1; then
        log_error "El daemon de Docker no está corriendo o tu usuario no tiene permisos sobre él."
        exit 1
      fi
      ;;
    load|up)
      require_cmd k3s "Instala k3s en el servidor."
      require_cmd docker "Instala Docker Engine para compilar o exportar la imagen."
      if ! docker info >/dev/null 2>&1; then
        log_error "El daemon de Docker no está corriendo o tu usuario no tiene permisos sobre él."
        exit 1
      fi
      if (( ${#SUDO_CMD[@]} > 0 )); then
        require_cmd sudo
      fi
      ;;
    deploy)
      require_cmd k3s "Instala k3s en el servidor."
      if [[ "$NEEDS_SUDO_FOR_KUBECTL" == true ]]; then
        require_cmd sudo
      fi
      ;;
    status|logs|down)
      require_cmd k3s "Instala k3s en el servidor."
      if [[ "$NEEDS_SUDO_FOR_KUBECTL" == true ]]; then
        require_cmd sudo
      fi
      ;;
  esac
}

configure_public_url() {
  PUBLIC_URL="${PUBLIC_URL:-http://localhost}"
  PUBLIC_URL="${PUBLIC_URL%/}"
  local origin_pattern='^https?://([A-Za-z0-9][A-Za-z0-9.-]*|\[[A-Fa-f0-9:]+\])(:([0-9]{1,5}))?$'
  if [[ ! "$PUBLIC_URL" =~ $origin_pattern ]]; then
    log_error "--public-url debe ser un origen HTTP/HTTPS sin ruta, usuario ni parámetros."
    return 1
  fi
  local port="${BASH_REMATCH[3]:-}"
  if [[ -n "$port" ]] && ((10#$port == 0 || 10#$port > 65535)); then
    log_error "El puerto de --public-url no es válido."
    return 1
  fi
}

validate_config() {
  local validation_errors=()

  if [[ ! -f "$K8S_DIR/configmap.yaml" ]]; then
    validation_errors+=("No se encontró $K8S_DIR/configmap.yaml.")
  elif ! kubectl_local patch --local --type merge -f "$K8S_DIR/configmap.yaml" -p '{}' -o name > /dev/null 2>&1; then
    validation_errors+=("[frontend-config] El archivo $K8S_DIR/configmap.yaml no tiene formato YAML válido.")
  fi

  if [[ ! -f "$K8S_DIR/frontend.yaml" ]]; then
    validation_errors+=("No se encontró $K8S_DIR/frontend.yaml.")
  elif ! kubectl_local patch --local --type merge -f "$K8S_DIR/frontend.yaml" -p '{}' -o name > /dev/null 2>&1; then
    validation_errors+=("[frontend] El archivo $K8S_DIR/frontend.yaml no tiene formato YAML válido.")
  fi

  if (( ${#validation_errors[@]} > 0 )); then
    echo ""
    log_error "Se encontraron ${#validation_errors[@]} error(es) en la configuración de Frontend:"
    local err
    for err in "${validation_errors[@]}"; do
      echo -e "   • $err"
    done
    return 1
  fi

  log_success "Configuración de Frontend K8s válida."
}

get_cluster_nodes() {
  "${KUBECTL_COMMAND[@]}" get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"|"}{range .status.conditions[?(@.type=="Ready")]}{.status}{end}{"|"}{range .status.addresses[?(@.type=="InternalIP")]}{.address}{end}{"\n"}{end}' 2>/dev/null || true
}

resolve_ssh_target() {
  local node_name="$1"
  local node_ip="$2"
  local user_prefix=""
  if [[ -n "$K3S_SSH_USER" ]]; then
    user_prefix="${K3S_SSH_USER}@"
  fi

  local ssh_pass="${K3S_SSH_PASSWORD:-${SSHPASS:-}}"
  local candidate err_out
  for candidate in "$node_name" "$node_ip"; do
    [[ -z "$candidate" ]] && continue
    if [[ -n "$ssh_pass" ]] && command -v sshpass >/dev/null 2>&1; then
      if SSHPASS="$ssh_pass" sshpass -e ssh -o ConnectTimeout=4 -o StrictHostKeyChecking=accept-new "${user_prefix}${candidate}" "true" >/dev/null 2>&1; then
        printf '%s' "${user_prefix}${candidate}"
        return 0
      fi
    fi

    if err_out=$(ssh -o BatchMode=yes -o ConnectTimeout=4 -o StrictHostKeyChecking=accept-new -o ControlPath="/tmp/k3s-ssh-%r@%h:%p" "${user_prefix}${candidate}" "true" 2>&1); then
      printf '%s' "${user_prefix}${candidate}"
      return 0
    fi
    if grep -qiE 'permission denied|keyboard-interactive|password|authentication' <<< "$err_out"; then
      printf '%s' "${user_prefix}${candidate}"
      return 0
    fi
  done
  return 1
}

ensure_cluster() {
  if command -v systemctl >/dev/null 2>&1; then
    if ! systemctl is-active --quiet k3s.service; then
      log_warn "El servicio k3s no está activo. Iniciando..."
      "${SUDO_CMD[@]}" systemctl start k3s.service
    fi
  fi

  log_info "Verificando nodos activos (Ready) en el clúster k3s..."
  local attempt=0 max_attempts=30 nodes_raw="" ready_count=0
  local node_name node_ready node_ip

  while (( attempt < max_attempts )); do
    nodes_raw=$(get_cluster_nodes)
    ready_count=0
    while IFS='|' read -r node_name node_ready node_ip; do
      [[ -z "$node_name" ]] && continue
      if [[ "$node_ready" == "True" ]]; then
        ready_count=$((ready_count + 1))
      fi
    done <<< "$nodes_raw"

    if (( ready_count > 0 )); then
      break
    fi
    attempt=$((attempt + 1))
    sleep 2
  done

  if (( ready_count == 0 )); then
    log_error "No se encontró ningún nodo Ready en el clúster k3s después de esperar $((max_attempts * 2))s."
    "${KUBECTL_COMMAND[@]}" get nodes -o wide || true
    exit 1
  fi

  while IFS='|' read -r node_name node_ready node_ip; do
    [[ -z "$node_name" ]] && continue
    if [[ "$node_ready" == "True" ]]; then
      log_success "Nodo Ready: $node_name (${node_ip:-sin-ip})"
    else
      log_warn "Nodo no disponible (${node_ready:-Unknown}): $node_name (${node_ip:-sin-ip}) — se omitirá."
    fi
  done <<< "$nodes_raw"
}

ensure_namespace() {
  if ! "${KUBECTL_COMMAND[@]}" get namespace "$NAMESPACE" >/dev/null 2>&1; then
    log_info "Creando namespace '$NAMESPACE'..."
    "${KUBECTL_COMMAND[@]}" create namespace "$NAMESPACE"
  fi
}

build_images() {
  log_info "Compilando Frontend (Producción) con NEXT_PUBLIC_URL=$PUBLIC_URL..."
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
  if ! docker image inspect "$image" >/dev/null 2>&1; then
    log_error "No existe la imagen local '$image'. Ejecuta 'build' primero o quita '--skip-build'."
    exit 1
  fi

  local local_short local_full
  local_short="$(hostname -s 2>/dev/null || hostname)"
  local_full="$(hostname 2>/dev/null || true)"

  local load_local=false
  local remote_nodes=()
  local remote_ssh_targets=()
  local nodes_raw node_name node_ready node_ip

  if [[ "$LOCAL_ONLY" == true ]]; then
    load_local=true
    log_info "Modo --local-only: se importará '$image' solo en el nodo local ($local_short)."
  else
    nodes_raw=$(get_cluster_nodes)
    if [[ -z "$nodes_raw" ]]; then
      load_local=true
    else
      while IFS='|' read -r node_name node_ready node_ip; do
        [[ -z "$node_name" ]] && continue
        if [[ "$node_ready" != "True" ]]; then
          log_warn "Omitiendo carga en nodo '$node_name' (estado: ${node_ready:-Unknown})."
          continue
        fi
        if [[ "$node_name" == "$local_short" || "$node_name" == "$local_full" ]]; then
          load_local=true
        else
          remote_nodes+=("$node_name|$node_ip")
        fi
      done <<< "$nodes_raw"
    fi
  fi

  local ssh_pass="${K3S_SSH_PASSWORD:-${SSHPASS:-}}"
  local use_sshpass=false
  if [[ -n "$ssh_pass" ]]; then
    if command -v sshpass >/dev/null 2>&1; then
      use_sshpass=true
    else
      log_warn "Se definió K3S_SSH_PASSWORD/SSHPASS pero 'sshpass' no está instalado; se pedirá la contraseña manualmente."
    fi
  fi

  local ssh_opts=(-o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new -o ControlMaster=auto -o ControlPath="/tmp/k3s-ssh-%r@%h:%p" -o ControlPersist=300)

  if (( ${#remote_nodes[@]} > 0 )); then
    require_cmd ssh "Instala openssh-client para distribuir imágenes a nodos worker Ready."
    local entry r_name r_ip resolved
    for entry in "${remote_nodes[@]}"; do
      IFS='|' read -r r_name r_ip <<< "$entry"
      if ! resolved=$(resolve_ssh_target "$r_name" "$r_ip"); then
        log_error "El nodo '$r_name' (${r_ip:-sin-ip}) está Ready pero no es alcanzable por SSH."
        log_warn "Verifica red/puerto 22 o usa '--local-only'."
        exit 1
      fi
      # Pre-autentica y abre socket ControlMaster antes del pipe de docker save
      if [[ "$use_sshpass" == true ]]; then
        SSHPASS="$ssh_pass" sshpass -e ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new "$resolved" "true"
      else
        if ! ssh -o BatchMode=yes "${ssh_opts[@]}" "$resolved" "true" >/dev/null 2>&1; then
          log_info "Autenticando SSH hacia '$r_name' ($resolved)..."
          ssh "${ssh_opts[@]}" "$resolved" "true"
        fi
      fi
      remote_ssh_targets+=("$r_name|$resolved")
    done
  fi

  log_info "Cargando imagen frontend en nodos Ready..."

  if [[ "$load_local" == true ]]; then
    if (( ${#SUDO_CMD[@]} > 0 )); then
      sudo -v
    fi
    echo "  ↳ [k3s:$local_short] Importando $image..."
    docker save "$image" | "${SUDO_CMD[@]}" k3s ctr --namespace k8s.io images import -
  fi

  local r_target remote_import_cmd
  remote_import_cmd='if [ "$(id -u)" -eq 0 ]; then k3s ctr --namespace k8s.io images import -; else sudo k3s ctr --namespace k8s.io images import -; fi'
  for entry in "${remote_ssh_targets[@]+"${remote_ssh_targets[@]}"}"; do
    IFS='|' read -r r_name r_target <<< "$entry"
    echo "  ↳ [k3s:$r_name] Enviando e importando $image por SSH ($r_target)..."
    if [[ "$use_sshpass" == true ]]; then
      docker save "$image" | SSHPASS="$ssh_pass" sshpass -e ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new "$r_target" "$remote_import_cmd"
    else
      docker save "$image" | ssh "${ssh_opts[@]}" "$r_target" "$remote_import_cmd"
    fi
  done

  log_success "Imagen inyectada correctamente en todos los nodos Ready."
}

deploy_app() {
  ensure_namespace

  if [[ "$SKIP_BUILD" == true && "$PUBLIC_URL_EXPLICIT" == true ]]; then
    log_warn "Se usó --skip-build con --public-url ($PUBLIC_URL). Next.js incrusta NEXT_PUBLIC_URL al compilar la imagen; si cambió la URL pública, recompila sin --skip-build."
  fi

  log_info "Desplegando configuración de Frontend..."

  local patch_data="\"NEXT_PUBLIC_URL\":\"$PUBLIC_URL\",\"API_URL\":\"http://gateway:3000\",\"NEXT_PUBLIC_ENABLE_API_MOCKING\":\"false\""
  if [[ -n "$NODE_ENV" ]]; then
    patch_data="$patch_data,\"NODE_ENV\":\"$NODE_ENV\""
  fi

  kubectl_local patch --local --type merge -f "$K8S_DIR/configmap.yaml" \
    -p "{\"data\":{$patch_data}}" \
    -o yaml | "${KUBECTL_COMMAND[@]}" apply -f -

  log_info "Desplegando Deployment y Service de Frontend..."
  "${KUBECTL_COMMAND[@]}" apply -f "$K8S_DIR/frontend.yaml"

  # Con tag ':latest' e imagePullPolicy IfNotPresent en containerd local, reiniciar fuerza la nueva imagen/config
  log_info "Actualizando pod de Frontend..."
  "${KUBECTL_COMMAND[@]}" rollout restart deployment/frontend -n "$NAMESPACE"

  if ! "${KUBECTL_COMMAND[@]}" rollout status deployment/frontend -n "$NAMESPACE" --timeout=180s; then
    log_error "Falló el despliegue de frontend."
    "${KUBECTL_COMMAND[@]}" get pods -n "$NAMESPACE" -l app=frontend || true
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

  if [[ "$LOG_FOLLOW" == true ]]; then
    follow_flags+=("-f")
  fi

  log_info "Consultando logs de Frontend en namespace '$NAMESPACE' (tail: $tail_lines)..."

  if ! "${KUBECTL_COMMAND[@]}" get pods -n "$NAMESPACE" -l app=frontend --no-headers 2>/dev/null | grep -q .; then
    log_warn "No se encontraron pods de 'frontend' en el namespace '$NAMESPACE'."
    return 1
  fi

  local container_args=()
  if [[ -n "$container" ]]; then
    container_args=("-c" "$container")
  else
    container_args=("--all-containers=true")
  fi

  if ! "${KUBECTL_COMMAND[@]}" logs -n "$NAMESPACE" -l app=frontend "${container_args[@]}" --tail="$tail_lines" "${follow_flags[@]+"${follow_flags[@]}"}"; then
    log_warn "El contenedor aún no emite logs o presenta un error de inicialización. Mostrando estado y eventos del pod:"
    "${KUBECTL_COMMAND[@]}" get pods -n "$NAMESPACE" -l app=frontend || true
    echo ""
    "${KUBECTL_COMMAND[@]}" describe pod -n "$NAMESPACE" -l app=frontend | tail -n 35 || true
  fi
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

Comandos disponibles (motor exclusivo: k3s):
  check      Valida los manifiestos YAML de frontend
  up         Ejecuta el flujo completo (build, load, deploy)
  build      Solo compila la imagen Docker de producción de frontend
  load       Solo carga la imagen compilada al containerd de k3s
  deploy     Aplica los manifiestos de frontend y reinicia el deployment
  status     Muestra el estado de pods y servicios de frontend
  logs       Muestra logs de frontend
  down       Elimina el deployment y servicio de frontend

Opciones / Parámetros:
  --skip-build             Salta la compilación si ya tienes la imagen lista
  --local-only             En 'load'/'up', importa la imagen solo en el nodo actual (omite workers)
  --public-url <url>       URL pública del frontend (Default: http://localhost)
  --node-env <ambiente>    Entorno de ejecución: production o development
  -s, --service <servicio> Acepta 'frontend' (compatibilidad con orquestador raíz)
  -c, --container <nombre> Nombre del contenedor
  --tail <líneas>          Número de líneas a mostrar (Default: 100)
  -f, --follow             Sigue los logs en tiempo real (Default: true)
  --no-follow              Muestra las líneas solicitadas y termina (sin -f)
  -h, --help               Muestra este mensaje de ayuda

Ejemplos:
  $(basename "$0") check
  $(basename "$0") up
  $(basename "$0") up --public-url https://iris.tu-dominio.com
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

if [[ "$ACTION" == logs && $# -gt 0 && "$1" != -* ]]; then
  LOG_APP="$1"
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --public-url|--node-env|--env|--tail|-c|--container|-s|--service)
      if [[ $# -lt 2 || -z "$2" || "$2" == --* ]]; then
        log_error "La opción $1 requiere un valor."
        exit 1
      fi
      ;;
  esac

  case "$1" in
    --skip-build)     SKIP_BUILD=true; shift ;;
    --local-only)     LOCAL_ONLY=true; shift ;;
    --public-url)     PUBLIC_URL="$2"; PUBLIC_URL_EXPLICIT=true; shift 2 ;;
    --node-env|--env) NODE_ENV="$2"; shift 2 ;;
    -s|--service)
      if [[ "$2" != *"frontend"* ]]; then
        log_error "Servicio no válido para frontend: '$2'. Solo se admite 'frontend'."
        exit 1
      fi
      shift 2
      ;;
    -y|--yes|--force) shift ;;
    --tail)           LOG_TAIL="$2"; shift 2 ;;
    -c|--container)   LOG_CONTAINER="$2"; shift 2 ;;
    -f|--follow)      LOG_FOLLOW=true; shift ;;
    --no-follow)      LOG_FOLLOW=false; shift ;;
    -h|--help)        show_help; exit 0 ;;
    *)
      if [[ "$ACTION" == logs && -z "$LOG_APP" && "$1" != -* ]]; then
        LOG_APP="$1"
        shift
      else
        log_error "Opción desconocida: $1"; show_help; exit 1
      fi
      ;;
  esac
done

setup_k3s_kubectl
preflight_checks "$ACTION"

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
    if [[ "$SKIP_BUILD" == false ]]; then
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
    ensure_cluster
    deploy_app
    ;;
  status) status ;;
  logs)   show_logs ;;
  down)   clean_app ;;
  *)      show_help; exit 1 ;;
esac
