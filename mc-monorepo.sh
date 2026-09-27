#!/bin/bash

# MC Monorepo - Utility Script

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}  MC Monorepo Manager${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
}

function print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

function print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

function print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

function print_error() {
    echo -e "${RED}✗ $1${NC}"
}

function show_usage() {
    cat << EOF
Uso: ./mc-monorepo.sh <comando>

Comandos:
  install       Instalar todas las dependencias
  build         Construir imágenes Docker
  up            Iniciar servicios con Docker Compose
  down          Detener servicios con Docker Compose
  logs          Ver logs en tiempo real
  clean         Limpiar node_modules y reiniciar
  status        Ver estado de los servicios
  help          Mostrar esta ayuda

Ejemplos:
  ./mc-monorepo.sh install
  ./mc-monorepo.sh build
  ./mc-monorepo.sh up
  ./mc-monorepo.sh logs
EOF
}

function install_deps() {
    print_info "Instalando dependencias del monorepo..."
    npm install
    print_success "Dependencias instaladas"
}

function build_docker() {
    print_info "Construyendo imágenes Docker..."
    docker-compose build
    print_success "Imágenes construidas"
}

function start_services() {
    print_info "Iniciando servicios con Docker Compose..."
    print_info "Frontend: http://localhost:8000"
    print_info "Backend: http://localhost:3000"
    docker-compose up
}

function stop_services() {
    print_info "Deteniendo servicios..."
    docker-compose down
    print_success "Servicios detenidos"
}

function show_logs() {
    print_info "Mostrando logs (Ctrl+C para salir)..."
    docker-compose logs -f
}

function clean() {
    print_warning "Limpiando node_modules y contenedores..."
    rm -rf node_modules
    docker-compose down -v
    npm install
    print_success "Monorepo limpio y reinstalado"
}

function show_status() {
    print_info "Estado de los servicios:"
    docker-compose ps
}

# Main
print_header

if [ $# -eq 0 ]; then
    print_error "Se requiere un comando"
    echo ""
    show_usage
    exit 1
fi

case "$1" in
    install)
        install_deps
        ;;
    build)
        build_docker
        ;;
    up)
        start_services
        ;;
    down)
        stop_services
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean
        ;;
    status)
        show_status
        ;;
    help)
        show_usage
        ;;
    *)
        print_error "Comando no reconocido: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
