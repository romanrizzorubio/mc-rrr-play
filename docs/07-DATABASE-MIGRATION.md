# Migrar MongoDB local a Docker en AWS EC2

Esta guía copia la base `mc` desde MongoDB local a MongoDB ejecutado con Docker Compose en una instancia EC2. La conexión al destino se hace mediante un túnel SSH: no es necesario exponer MongoDB a Internet.

## Antes de empezar

- Instala MongoDB Database Tools en el equipo que ejecutará `mongodump` y `mongorestore`.
- Confirma que el origen contiene la base correcta. En este proyecto el nombre predeterminado es `mc`.
- Ten acceso SSH a la instancia EC2 y confirma la carpeta donde está el `docker-compose.yml`.
- Reserva espacio local para el dump de origen y el respaldo del destino.

El dump incluye datos personales, como cuentas, direcciones de correo, sesiones y mazos. Guárdalo con permisos restringidos, no lo adjuntes a incidencias ni lo añadas a Git. No copies directamente `.local/mongodb` ni `/data/db`: usa el formato lógico de `mongodump`.

## 1. Crear el dump del origen

En tu Mac, mientras la base de origen esté activa, ejecuta:

```bash
umask 077
mongodump --uri="mongodb://127.0.0.1:27017" --db=mc \
  --archive=./mc-source.archive --gzip
chmod 600 ./mc-source.archive
```

Si el origen usa otro host, puerto, credenciales o nombre de base, adapta la URI y `--db`. No pegues credenciales en este documento ni en el repositorio. Comprueba que el comando termina correctamente y que `mc-source.archive` existe.

Si el origen y otro MongoDB local usan el mismo puerto `27017`, solo uno puede estar activo a la vez. Asegúrate de que el comando se conecta al origen antes de continuar.

## 2. Proteger y preparar MongoDB en EC2

En la instancia EC2, desde la carpeta del proyecto:

```bash
docker compose stop mc-user-service mc-backend mc-match-creation mc-deck-service
```

Esto detiene temporalmente los servicios que escriben en la base y deja MongoDB funcionando. No detengas ni elimines el volumen de MongoDB.

El `docker-compose.yml` del proyecto publica el puerto de MongoDB como `27017:27017`. En AWS, no permitas tráfico entrante al puerto `27017` en el Security Group. Es preferible limitar el mapeo del host a loopback:

```yaml
ports:
  - "127.0.0.1:27017:27017"
```

Los contenedores de la aplicación se conectan por la red de Compose a `mongodb:27017`; no necesitan que el puerto de MongoDB esté abierto públicamente. Si cambias el mapeo, aplica y verifica el cambio antes de abrir el túnel. Permite SSH solo desde tu IP, o usa AWS Systems Manager si ya está configurado.

## 3. Abrir un túnel SSH

Desde otra terminal de tu Mac, abre el túnel y déjalo activo durante el respaldo y la restauración:

```bash
ssh -i "$HOME/.ssh/mi-clave.pem" -N \
  -L 27018:127.0.0.1:27017 \
  ec2-user@ec2-xx-xx-xx-xx.region.compute.amazonaws.com
```

Sustituye la clave, el usuario y el nombre DNS por los de tu instancia. El usuario suele ser `ec2-user` en Amazon Linux o `ubuntu` en Ubuntu. El puerto local `27018` del Mac se reenviará al puerto `27017` de MongoDB en la EC2.

Si MongoDB requiere autenticación, usa la URI autenticada correspondiente en los comandos siguientes y conserva las credenciales fuera del repositorio y del historial compartido.

## 4. Respaldar el destino y restaurar

Antes de cambiar la base de AWS, guarda una copia del destino a través del túnel:

```bash
mongodump --uri="mongodb://127.0.0.1:27018" --db=mc \
  --archive=./mc-aws-before.archive --gzip
chmod 600 ./mc-aws-before.archive
```

Si el destino está vacío, restaura sin `--drop`:

```bash
mongorestore --uri="mongodb://127.0.0.1:27018" \
  --nsInclude='mc.*' \
  --archive=./mc-source.archive --gzip
```

Si quieres que el origen reemplace las colecciones coincidentes que ya existen en AWS, y has verificado el respaldo del destino, añade `--drop`:

```bash
mongorestore --uri="mongodb://127.0.0.1:27018" \
  --nsInclude='mc.*' --drop \
  --archive=./mc-source.archive --gzip
```

`--drop` elimina cada colección de destino incluida en el dump antes de restaurarla. Si necesitas combinar datos distintos que ya existan en origen y destino, no uses `--drop` ni des por hecho que la restauración los combinará: resuelve primero cómo tratar IDs duplicados y registros que deban conservarse.

## 5. Reiniciar y verificar

En la EC2, desde la carpeta del proyecto, vuelve a iniciar los servicios:

```bash
docker compose up -d
```

Comprueba los recuentos en MongoDB:

```bash
docker compose exec mongodb mongosh mc --quiet --eval \
  'printjson({users: db.users.countDocuments(), userSessions: db.userSessions.countDocuments(), decks: db.decks.countDocuments(), matches: db.matches.countDocuments()})'
```

Compara los resultados con el origen y verifica que puedes iniciar sesión y consultar los mazos esperados. La copia incluye la colección `userSessions`, pero las cookies del navegador de la instalación local no se trasladan al dominio de AWS; inicia sesión de nuevo allí.

Al arrancar, el backend vuelve a aplicar el catálogo incluido en el proyecto. Esto puede reemplazar datos personalizados de las colecciones del catálogo; el seed no modifica `users`, `userSessions`, `decks` ni `matches`.

Tras comprobar la migración, cierra el túnel con `Ctrl+C`. Conserva los archivos de respaldo en almacenamiento privado hasta confirmar que la aplicación funciona; no los subas al repositorio.
