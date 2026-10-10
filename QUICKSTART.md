# Inicio Rápido del Monorepo MC

## ✅ Configuración Completada

El monorepo incluye:

- ✅ Frontends: carcasa `mc-frontend`, remotos `mc-match`, `md-deck` y `mc-static`
- ✅ Servicios: `mc-back`, `mc-match-creation-service` y `md-deck-service`
- ✅ Packages compartidos: `mc-endpoints`, `mc-shared` y `mc-data`
- ✅ Root `package.json` con workspaces de npm
- ✅ Dockerfiles para frontend y backend
- ✅ `docker-compose.yml` configurado
- ✅ Dependencias instaladas

## 🚀 Cómo Iniciar

### Opción 1: Usar Docker (Recomendado)

```bash
# Iniciar carcasa, remotos, microservicios y MongoDB
docker-compose up

# O usar el script de utilidad
./mc-monorepo.sh up
```

Luego accede a:
- **Frontend**: http://localhost:8000
- **mc-match**: http://localhost:8100
- **md-deck**: http://localhost:8200
- **mc-static**: http://localhost:8300
- **Servicio de partidas**: http://localhost:3000
- **Servicio de creación**: http://localhost:3001
- **Servicio de mazos**: http://localhost:3002
- **MongoDB**: mongodb://localhost:27017

El backend carga automáticamente en MongoDB los registros del catálogo inicial que falten.

### Opción 2: Desarrollo Local

```bash
# MongoDB en Docker; frontends y servicios locales
npm run start:all

# MongoDB instalado localmente; frontends y servicios locales
npm run start:all:local
```

`npm run start:all` es el modo predeterminado: inicia MongoDB con Docker Compose y ejecuta los frontends y servicios en el host. Para usar MongoDB local, instala MongoDB Community Server y ejecuta `npm run start:all:local`; guarda sus datos en `.local/mongodb`. Para ejecutar el stack completo en Docker, usa `npm run docker:up`. El contenedor de MongoDB se puede detener por separado con `npm run mongo:down`.

## 📦 Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Volver a cargar el catálogo inicial en MongoDB
npm run seed:data

# Iniciar servicios con Docker
npm run docker:up

# Detener servicios
npm run docker:down

# Ver logs
npm run docker:logs

# Compilar imágenes Docker
npm run docker:build
```

## 🛠️ Script de Utilidad

El archivo `mc-monorepo.sh` proporciona comandos útiles:

```bash
./mc-monorepo.sh up       # Iniciar servicios
./mc-monorepo.sh down     # Detener servicios
./mc-monorepo.sh logs     # Ver logs
./mc-monorepo.sh status   # Estado de servicios
./mc-monorepo.sh clean    # Limpiar y reinstalar
./mc-monorepo.sh build    # Compilar imágenes
./mc-monorepo.sh install  # Instalar dependencias
```

## 📁 Estructura del Proyecto

```
mc-rrr-play/
├── packages/
│   ├── front/
│   │   ├── mc-frontend/  # Carcasa y creación de partidas
│   │   ├── mc-match/     # Remoto de juego
│   │   ├── md-deck/      # Remoto hello world
│   │   └── mc-static/    # Imágenes, fuentes y estilos compartidos
│   ├── back/
│   │   ├── mc-back/      # Servicio de partidas (Express + Socket.IO)
│   │   ├── mc-match-creation-service/ # Catálogo y orquestación
│   │   ├── md-deck-service/ # Placeholder de mazos
│   │   └── mc-data/      # Acceso a MongoDB y catálogo inicial
│   └── core/
│       ├── mc-endpoints/ # Contratos REST y Socket.IO
│       └── mc-shared/    # Constantes compartidas del dominio
├── docker-compose.yml    # Orquestación de servicios
├── Dockerfile.frontend   # Imagen del frontend
├── Dockerfile.backend    # Imagen del backend
├── package.json          # Root con workspaces
├── mc-monorepo.sh        # Script de utilidad
└── README.md             # Documentación completa
```

## 🌐 Redes y Comunicación

Los servicios se comunican a través de la red `mc-network`:
- Carcasa → Puerto 8000
- Remotos → Puertos 8100, 8200 y 8300
- Microservicios → Puertos 3000, 3001 y 3002
- MongoDB → Puerto 27017; catálogo inicial en `packages/back/mc-data/seed/catalog/` (cartas de aspecto agrupadas por aspecto y tipo)
- Volúmenes compartidos para desarrollo en tiempo real

## 📝 Notas Importantes

1. Los cambios en los archivos se sincronizan automáticamente con Docker
2. Las dependencias están compartidas entre todos los servicios
3. El servicio de creación consume el API interno del servicio de partidas
4. Cada servicio tiene su propio contenedor Docker

## 🐛 Troubleshooting

Si tienes problemas:

```bash
# Limpiar completamente y reiniciar
./mc-monorepo.sh clean

# Ver estado detallado
./mc-monorepo.sh status

# Ver logs completos
./mc-monorepo.sh logs
```

¡Listo para empezar! 🎉
