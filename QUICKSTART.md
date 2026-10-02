# Inicio Rápido del Monorepo MC

## ✅ Configuración Completada

El monorepo ha sido configurado correctamente con:

- ✅ Paquetes: `mc-frontend`, `mc-back`, `mc-endpoints`, `mc-shared` y `mc-data`
- ✅ Root `package.json` con workspaces de npm
- ✅ Dockerfiles para frontend y backend
- ✅ `docker-compose.yml` configurado
- ✅ Dependencias instaladas
- ✅ Imágenes Docker construidas

## 🚀 Cómo Iniciar

### Opción 1: Usar Docker (Recomendado)

```bash
# Iniciar frontend, backend y MongoDB
docker-compose up

# O usar el script de utilidad
./mc-monorepo.sh up
```

Luego accede a:
- **Frontend**: http://localhost:8000
- **Backend**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017

El backend carga automáticamente en MongoDB los registros del catálogo inicial que falten.

### Opción 2: Desarrollo Local

```bash
# MongoDB en Docker; frontend y backend locales
npm run start:all

# MongoDB instalado localmente; frontend y backend locales
npm run start:all:local
```

`npm run start:all` es el modo predeterminado: inicia MongoDB con Docker Compose y ejecuta frontend/backend en el host. Para usar MongoDB local, instala MongoDB Community Server y ejecuta `npm run start:all:local`; guarda sus datos en `.local/mongodb`. Para ejecutar los tres servicios en Docker, usa `npm run docker:up`. El contenedor de MongoDB se puede detener por separado con `npm run mongo:down`.

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
│   ├── mc-frontend/      # Frontend (Lit-Element)
│   ├── mc-back/          # Backend (Express + Socket.IO)
│   ├── mc-endpoints/     # Contratos REST y Socket.IO
│   ├── mc-shared/        # Constantes compartidas del dominio
│   └── mc-data/          # Acceso a MongoDB y catálogo inicial
├── docker-compose.yml    # Orquestación de servicios
├── Dockerfile.frontend   # Imagen del frontend
├── Dockerfile.backend    # Imagen del backend
├── package.json          # Root con workspaces
├── mc-monorepo.sh        # Script de utilidad
└── README.md             # Documentación completa
```

## 🌐 Redes y Comunicación

Los servicios se comunican a través de la red `mc-network`:
- Frontend → Puerto 8000
- Backend → Puerto 3000
- MongoDB → Puerto 27017; catálogo inicial en `mc-data/seed/catalog/` (cartas de aspecto agrupadas por aspecto y tipo)
- Volúmenes compartidos para desarrollo en tiempo real

## 📝 Notas Importantes

1. Los cambios en los archivos se sincronizan automáticamente con Docker
2. Las dependencias están compartidas entre todos los servicios
3. El backend se inicia después del frontend
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
