# Características Funcionales del Usuario

## Gestión de Partidas

### Crear Una Partida

**¿Qué permite?**
El usuario puede crear una nueva partida configurando parámetros básicos.

**Pasos:**
1. Acceder a "Nueva Partida"
2. Ingresar nombre de la partida
3. Seleccionar dificultad
4. Presionar "Crear"

**Resultado:**
- Se crea una partida nueva
- El usuario se convierte en anfitrión
- Se asigna un ID único a la partida
- La partida entra en estado de espera

### Unirse a Una Partida

**¿Qué permite?**
Un usuario puede unirse a una partida existente que aún no ha comenzado.

**Pasos:**
1. Ver lista de partidas disponibles
2. Seleccionar la partida deseada
3. Presionar "Unirse"
4. Completar datos de jugador

**Requisitos:**
- Partida debe estar en estado de espera
- Número máximo de jugadores no alcanzado
- Nombre de usuario único en la partida

## Configuración de Partida

### Seleccionar Superhéroe

**¿Qué permite?**
Elegir cuál superhéroe controlará durante la partida.

**Información Mostrada:**
- Nombre del héroe
- Puntos de vida
- Cartas iniciales
- Imagen ilustrativa
- Habilidades especiales

**Disponibilidad:**
Los héroes disponibles dependen de:
- Cartas instaladas en el sistema
- Configuración de la partida
- Selecciones de otros jugadores (sin duplicados)

### Seleccionar Escenario

**¿Qué permite?**
Elegir el villano y escenario contra el que jugarán.

**Información del Escenario:**
- Nombre del villano
- Nivel de dificultad
- Habilidades del villano
- Cartas de encuentro
- Modificadores especiales

**Dificultades:**
- **Fácil** - Menos amenaza, menos minions
- **Estándar** - Valores balanceados
- **Difícil** - Más amenaza, más minions, enemigos más fuertes
- **Experto** - Máxima dificultad, cambios de reglas

## Jugabilidad

### Pantalla Principal del Juego

La pantalla se divide en varias áreas:

**Tablero Central (Board)**
- Muestra villano y minions
- Contador de amenaza del villano
- Contador de vida del villano
- Efectos activos en juego

**Zona del Jugador (Player Area)**
- Superhéroe con contador de vida
- Cartas en juego (aliados, mejoramientos)
- Contador de recursos (física/mental)
- Estado y efectos activos

**Mano (Hand)**
- Cartas disponibles para jugar
- Costo de cada carta
- Requisitos para jugar

**Panel de Estado (Status Panel)**
- Turno actual
- Fase actual
- Información de todos los jugadores
- Contador de aceleración

### Ejecutar Acciones

#### Jugar una Carta

**Requiere:**
- Carta en la mano
- Suficientes recursos (para cartas de costo)
- Cumplir condiciones especiales (si aplica)

**Pasos:**
1. Hacer clic en la carta
2. Seleccionar destino (si aplica)
3. Confirmar acción
4. Efecto se resuelve automáticamente

**Resultado:**
- Carta se mueve a zona de juego
- Se gastan recursos
- Se desencadenan triggers
- Efectos se aplican

#### Atacar a un Enemigo

**Requiere:**
- 1 Recurso de Física
- Elegir qué enemigo atacar

**Cómo:**
1. Seleccionar personaje atacante
2. Presionar "Atacar"
3. Seleccionar enemigo objetivo
4. Sistema calcula daño
5. Daño se aplica automáticamente

**Efectos Especiales:**
- **Overkill** - Daño extra se convierte en amenaza
- **Piercing** - Ignora defensas
- **Unstoppable** - No puede reducirse

#### Defender

**Requiere:**
- 1 Recurso de Mental
- Un ataque entrante

**Cómo:**
1. Cuando enemigo ataca, se muestra opción "Defender"
2. Seleccionar cartas para defender
3. Sistema suma defensa
4. Daño se reduce por cantidad defendida

#### Contraarrestar Amenaza (Thwart)

**Requiere:**
- 1 Recurso de Mental
- Disponibilidad en la zona de juego

**Cómo:**
1. Seleccionar personaje
2. Presionar "Contraarrestar"
3. Se reduce amenaza generada

**Diferencia con Defensa:**
- Afecta la amenaza del villano, no el daño
- Puede ser ejecutado por otros jugadores
- Efectos especiales diferentes

### Gestión de Recursos

**Recursos Disponibles por Turno:**
- 1 Física (para ataques)
- 1 Mental (para defensa/thwart)

**Aumento de Recursos:**
- Cartas especiales pueden generar más
- Aliados pueden proporcionar recursos
- Mejoramientos pueden aumentar límites

**Visualización:**
- Iconos claramente diferenciados
- Mostrados en la zona del jugador
- Contador en tiempo real

## Sistema de Turno

### Estructura Automática

El sistema gestiona automáticamente:
- Distribución de recursos
- Límites de acciones
- Transición entre fases
- Resolución de triggers

### Fases del Turno

**Fase de Preparación**
- Mensaje: "Tu turno comienza"
- Recursos se regeneran automáticamente
- Cartas se resetean

**Fase de Planificación**
- Puedes jugar cartas
- Puedes ejecutar activaciones
- Continúa hasta presionar "Fin de Turno"

**Fase de Activación (Enemigos)**
- No es interactiva
- Enemigos atacan automáticamente
- Sistema muestra acciones

**Fase de Resolución**
- Efectos pendientes se resuelven
- Daño y amenaza se aplican
- Condición de victoria/derrota se verifica

## Información Disponible

### Ver Estado de Enemigos

En cualquier momento puedes:
- Hacer clic en un enemigo
- Ver sus puntos de vida
- Ver sus habilidades
- Ver sus efectos activos

### Ver Estado de Aliados

Puedes ver:
- Cartas que has jugado
- Puntos de vida de aliados
- Mejoramientos adjuntos
- Efectos activos

### Ver Historial de Juego

Se muestra un registro de:
- Últimas acciones ejecutadas
- Daño infligido/recibido
- Cartas jugadas
- Cambios importantes

## Finalización

### Victoria

**Condiciones:**
- Villano derrotado (0 HP)
- Se cumplen objetivos especiales

**Pantalla de Victoria:**
- Mensaje de felicitación
- Estadísticas del juego
- Opción de jugar de nuevo

### Derrota

**Condiciones:**
- Cualquier jugador derrotado
- Amenaza alcanza máximo

**Pantalla de Derrota:**
- Causa de la derrota
- Análisis de qué salió mal
- Opción de reintentrar
- Opción de otra partida

## Características Avanzadas

### Ver Cartas Jugadas

Puedes visualizar:
- Todas las cartas en zona de juego
- Cartas en descarte
- Cartas en baraja de encuentro
- Estadísticas de cada carta

### Modo Multiplayer

**Comunicación:**
- Ver acciones de otros jugadores
- Información de sus manos oculta
- Contador de cartas en mano
- Estado de sus recursos

**Coordinación:**
- Turnos alternados entre jugadores
- Pueden sugerir acciones (si implementado)
- Estado sincronizado en tiempo real

### Efectos Visuales

El sistema muestra visualmente:
- Animaciones de ataques
- Aplicación de daño
- Cambios de estado
- Efectos especiales
- Triggers activándose

## Accesibilidad

### Información Clara

- Iconos estandarizados
- Explicaciones al pasar mouse
- Tooltips con reglas
- Panel de ayuda

### Controles Intuitivos

- Drag & drop para cartas
- Botones claramente marcados
- Atajos de teclado (si aplicable)
- Navegación consistente

### Modo Ayuda

- Tutorial al primer juego
- Explicaciones de reglas
- Guía de atajos
- Glossario de términos
