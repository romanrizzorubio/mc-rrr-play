# Diagnóstico de errores en AWS

Esta guía ayuda a distinguir errores del navegador de problemas entre el gateway Nginx y los servicios en EC2 o ECS.

## Error al cargar un remoto o una configuración

Mensajes como `Failed to fetch dynamically imported module` suelen indicar que el navegador no pudo obtener el módulo remoto. Comprueba la respuesta pública del remoto y la configuración:

```bash
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' \
  https://mc-rrr.com/static/src/remote-entry.js
curl -sS https://mc-rrr.com/app-config.json
```

En `app-config.json`, las URL deben usar el dominio público y conservar las rutas del gateway, por ejemplo `https://mc-rrr.com/static/src/remote-entry.js` y `https://mc-rrr.com/api/deck/`.

- `502 text/html`: Nginx no pudo obtener una respuesta del upstream; revisa el estado del servicio y los logs de Nginx.
- `200 text/html` para `remote-entry.js`: probablemente la ruta cayó en la aplicación frontend en vez del remoto; revisa el prefijo `/static/` y la configuración `base` de Vite.
- `404`: comprueba que el remoto se publica bajo el mismo prefijo que usa `app-config.json`.

En `nginx.conf`, las rutas de microfrontends deben conservar el prefijo que necesita Vite (`/match/`, `/deck/`, `/static/` o `/users/`). El `proxy_pass` sin una URI adicional reenvía la URI original. Evita añadir `$request_uri` a esos `proxy_pass`: al usar una variable, Nginx puede necesitar un `resolver` para resolver el nombre del servicio.

## Error al cargar mazos o parsear JSON

El mensaje `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` indica que el cliente recibió HTML donde esperaba JSON. En modo Gateway, verifica en las herramientas de red del navegador que las solicitudes de mazos vayan a rutas como `/api/deck/decks`, no a `/decks`. La URL base de `mc-deck-service` debe incluir `/api/deck/`; la ruta `/decks` sin ese prefijo pertenece al frontend.

Si la ruta de la API devuelve `502`, aplica también las comprobaciones de upstream de esta guía. Si devuelve `200 text/html`, el prefijo del gateway o la URL construida por el cliente no coincide con la ruta del servicio.

## EC2 con Docker Compose

Desde el directorio del repositorio en EC2, comprueba los contenedores y sus logs:

```bash
docker compose ps
docker compose logs --tail=100 \
  mc-gateway mc-match mc-deck mc-static mc-users \
  mc-match-creation mc-deck-service
```

Revisa el error de Nginx y la configuración que realmente está cargada:

```bash
docker compose exec mc-gateway nginx -T
```

Los mensajes habituales indican dónde buscar:

- `no resolver defined to resolve ...`: el gateway está usando una configuración con `proxy_pass` variable; actualiza `nginx.conf` y recrea `mc-gateway`.
- `connect() failed` o `connection refused`: el contenedor upstream está detenido, no escucha en el puerto esperado o no está saludable.
- `host not found in upstream`: el nombre del servicio no resuelve desde la red de Docker; comprueba el nombre del servicio y que esté conectado a `mc-network`.

Puedes comprobar desde el gateway si alcanza un remoto y su endpoint de salud:

```bash
docker compose exec mc-gateway \
  wget -qO- http://mc-static:8300/healthz
```

Para comprobar otro remoto, usa su nombre y puerto de `docker-compose.yml`: `mc-match:8100`, `mc-deck:8200` o `mc-users:8400`. Para las APIs afectadas, usa `mc-match-creation:3001` o `mc-deck-service:3002`.

Después de publicar cambios en `nginx.conf`, actualiza el repositorio y valida/recrea solo el gateway:

```bash
git pull
docker compose exec mc-gateway nginx -t
docker compose up -d --force-recreate mc-gateway
```

Si el cambio afecta al código de los remotos `mc-deck` o `mc-users`, reconstruye y recrea esos servicios:

```bash
docker compose build mc-deck mc-users
docker compose up -d --force-recreate mc-deck mc-users
```

No uses `docker compose down -v` para resolver problemas de gateway: eliminaría también los volúmenes persistentes.

## ECS

1. Comprueba en ECS que `mc-gateway` y los servicios afectados tengan tareas `RUNNING` y saludables; revisa sus logs en CloudWatch.
2. Verifica que el gateway pueda resolver los nombres de servicio configurados en `nginx.conf` y conectarse a sus puertos privados.
3. Si los servicios usan grupos de seguridad distintos, permite el tráfico entrante a los puertos necesarios desde el grupo del gateway, no desde Internet. Los puertos de los remotos son 8100, 8200, 8300 y 8400; las APIs de creación y mazos usan 3001 y 3002.
4. Si cambió `nginx.conf`, actualiza la configuración o imagen del gateway y fuerza un nuevo despliegue de su servicio. Si cambió el código de un remoto, reconstruye y publica su imagen y fuerza un nuevo despliegue de esa tarea.
