# Doctrina de Resolución de Problemas

Esta guía establece el estándar de oro para la depuración y resolución de errores en el proyecto.

## Principio Fundamental: Búsqueda de la Causa Raíz

Cuando ocurre un error (especialmente un `TypeError` por propiedades indefinidas), la solución NO es simplemente añadir encadenamiento opcional (`?.`) o valores por defecto para evitar que el programa falle. 

**Debemos buscar SIEMPRE por qué el parámetro o propiedad no tiene el valor esperado.**

### Protocolo de Actuación

1.  **No Enmascarar**: Evitar el uso de `?.` como primera medida. Si un dato *debería* estar ahí según la lógica de negocio, su ausencia es un síntoma de un bug anterior.
2.  **Rastreo de Datos**: Seguir el flujo de ejecución hacia atrás desde el punto del error hasta encontrar dónde se perdió la referencia o dónde falló la asignación.
3.  **Corrección en el Origen**: Reparar el flujo de datos para asegurar que los parámetros necesarios lleguen a su destino.
4.  **Uso Justificado de `?.`**: Solo se permite el encadenamiento opcional en casos donde la propiedad sea genuinamente opcional por diseño (ej. campos opcionales en una configuración) o en fronteras con sistemas externos inciertos, y siempre documentando por qué es opcional.
5.  **Validaciones Explícitas**: Preferir validaciones que lancen errores claros o manejen estados de error de forma controlada sobre el fallo silencioso que a veces provoca `?.`.

## Ejemplos de Mala vs Buena Práctica

*   **Mal**: `const name = user?.profile?.name;` (Si el usuario siempre debe tener perfil, estamos ocultando un error de carga del perfil).
*   **Bien**: Asegurar que la función que carga al usuario incluya el perfil o investigar por qué la base de datos devolvió un objeto incompleto.

Al aplicar cambios, el desarrollador debe poder explicar exactamente qué causó la ausencia del valor y cómo el cambio asegura que no vuelva a faltar.
