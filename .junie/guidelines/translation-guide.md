# Guía de Traducción y Estilo (Skill)

Esta guía contiene las traducciones oficiales y reglas de estilo para la documentación del proyecto. Debe ser consultada antes de realizar cualquier cambio en la documentación para asegurar la consistencia terminológica.

## Diccionario de Traducciones

| Término Original | Traducción Oficial |
| :--- | :--- |
| **encounter group** | conjunto de encuentros |
| **identity** | personaje (superhéroe) |
| **form** | identidad |
| **hero** | héroe (forma) |
| **alter ego** | alter ego (forma) |
| **leaves play** | abandona el juego |
| **prevent** | evitar |
| **scheme (sustantivo)** | plan |
| **scheme (verbo)** | ejecutar el plan / ejecución de plan |
| **boost** | aumento |
| **threat** | amenaza |
| **all-purpose counter** | contador de cualquier tipo |
| **consequential damage** | daño derivado |
| **cost** | coste |
| **flip** | dar la vuelta |
| **treachery** | perfidia |
| **Standard** | Normal |
| **`pool** | Masacrismo |
| **attachment** | accesorio |
| **attach to** | vincular a |
| **ATK** | ATQ |
| **basic power** | atributo básico |
| **SCH** | PLA |
| **SCH (atributo)** | planificación |
| **steady** | tesón |
| **remove** | quitar |
| **take damage** | sufrir daño |
| **delayed effect** | efecto postergado |
| **tucked cards** | cartas metidas debajo |
| **excess damage** | daño sobrante |
| **reveal** | mostrar |
| **hazard icon** | icono de riesgo |
| **wild icon** | icono universal |
| **wild resource** | recurso universal |
| **instead** | en vez de eso |
| **hinder** | complicación |
| **overkill** | **brutalidad** (overkill) / Brutalidad |
| **linked** | **enlazada** |
| **piercing** | **penetrante** |
| **restricted** | **restringida** |
| **Stalwart** | **firmeza** |
| **team-up** | **equipo** |
| **toughness** | **dureza** |
| **when revealed** | **cuando se muestre esta carta** |
| **when defeated** | **cuando se derrote esta carta** |
| **when completed** | **cuando se complete esta etapa** |
| **quickstrike** | **ataque veloz** |
| **teamwork** | **trabajo en equipo** |
| **nemesis encounter set** | conjunto de archienemigo |
| **otherwise** | en caso contrario |
| **patrol** | patrulla |
| **per player icon** | icono por jugador |
| **peril** | peligro |
| **permanent** | permanente |
| **physical resource** | recurso físico |
| **play** | jugar |
| **put into play** | poner en juego |
| **play area** | zona de juego |
| **play restrictions** | restricciones de juego |
| **player** | jugador |
| **player card** | carta de jugador |
| **player deck** | mazo de jugador |
| **Find** | localizar |
| **Search** | buscar |
| **setup** | preparación |
| **skirmish mode** | modo escaramuza |
| **special** | especial |
| **standard mode** | modo Normal (también Normal a secas) |
| **standard set** | conjunto Normal |
| **shuffle** | barajar |
| **side scheme** | plan secundario |
| **star icon** | icono de estrella |
| **simultaneous resolution** | resolución simultánea |
| **status cards** | cartas de estado |
| **steady** | tesón |
| **stun / stunned** | aturdir / aturdido |
| **subtitle** | subtítulo |
| **confuse / confused** | confundir / confundido |
| **support** | apoyo |
| **surge** | oleada |
| **sustained damage** | daño sufrido |
| **swap** | intercambiar |
| **table talk** | charla en la mesa |
| **target** | objetivo |
| **target threat** | umbral de amenaza |
| **team-up** | equipo |
| **teamwork** | trabajo en equipo |
| **hero form** | identidad de héroe |
| **alter-ego form** | identidad de alter ego |
| **temporary** | temporal |
| **text box** | Cuadro de texto |
| **that** | ese/a / ese/a mismo/a |
| **then** | luego |
| **this** | este/a / este/a mismo/a |
| **thwart** | intervenir |
| **THW** | INT |
| **thwart (atributo)** | intervención |
| **tough** | duro |
| **trait** | rasgo |
| **triggered ability** | capacidad activada |
| **triggering condition** | condición de activación |
| **tuck** | meter debajo |
| **undefended** | no defendido |
| **unique icon** | icono de unicidad |
| **upgrade** | mejora |
| **uses** | usos |
| **victory display** | zona de victoria |
| **victory X** | victoria X |
| **villain** | villano |
| **villain deck** | mazo de villano |
| **villain defeat** | derrota del villano |
| **villain phase** | fase del villano |
| **villain's play area** | zona de juego del villano |
| **villainous** | infame |
| **vulnerable** | vulnerable |
| **would** | haría |
| **you / your** | tú / tu |
| **winning the game** | ganar la partida |
| **deck customization** | personalización de mazos |
| **aspect** | aspecto |
| **basic cards** | cartas básicas |
| **modular encounter set** | conjunto de encuentros modular |
| **expert mode** | modo Experto |
| **expert encounter set** | conjunto de encuentro experto |
| **persona (rasgo)** | individuo |
| **condition (rasgo)** | alteración |
| **android (rasgo)** | droide |

## Representación de Iconos

| Icono   | Representación | Significado        |
|:--------|:---------------|:-------------------|
| **[p]** | [p]            | recurso físico     |
| **[e]** | [e]            | recurso de energía |
| **[m]** | [m]            | recurso mental     |
| **[w]** | [w]            | recurso universal  |
| **[d]** | [d]            | daño derivado      |
| **[u]** | [u]            | carta única        |

## Instrucciones para el Asistente

1. **Prioridad**: Estas traducciones tienen precedencia sobre cualquier otra traducción automática.
2. **Autoactualización**: Si el usuario solicita una corrección terminológica, esta tabla DEBE actualizarse inmediatamente en el mismo paso que la corrección del documento.
3. **Consistencia**: Al añadir nueva documentación, escanea el archivo `docs/02-GAME-MECHANICS.md` para asegurar que los términos circundantes usan esta misma terminología.
4. **Iconos**: Utiliza y comprende el formato de corchetes `[x]` para representar iconos de recursos y otros elementos del juego según la tabla de "Representación de Iconos".
5. **Formato de Descripción de Cartas**: El usuario proporciona descripciones de cartas con el siguiente formato, el cual debes saber interpretar para validar o generar código:
    - **[u] Nombre (Subtítulo)**: Indica si es única y su identidad.
    - **Cantidad (ej. x2)**: (Opcional) Indica el número de copias en el mazo.
    - **Imagen/img**: Ruta o nombre del archivo de imagen (ej. `heroes/she-hulk/01020.webp` o `img: 01021.png`).
    - **Tipo de carta**: Aliado, Evento, Mejora, Apoyo, Identidad de héroe, Identidad de alter ego, etc.
    - **Rasgos**: Lista de rasgos separados por puntos (ej. Vengador. Espía.).
    - **Coste / Salud / Atributos**: Valores numéricos. El daño derivado se marca con `[d]`. El ataque se traduce como Attack/ATQ y la intervención como Thwart/INT.
    - **Recursos**: Iconos entre corchetes (ej. `[w]` para universal).
    - **Capacidades**: Texto descriptivo precedido por el tipo (Acción, Respuesta, Interrupción, etc.) y opcionalmente el límite de uso.

### Formato de Cartas de Encuentro
Al trabajar con cartas de encuentro (obligaciones, planes secundarios, esbirros de archienemigo, perfidias), adapta tu interpretación al formato que el usuario proporcione en cada paso, utilizando las siguientes categorías como referencia para mapear a la estructura interna:
- **Tipo de carta**: Obligación, Plan secundario, Esbirro, Perfidia, Accesorio.
- **[u] Nombre**: Nombre de la carta (con `[u]` si es única).
- **Rasgos**: Rasgos separados por puntos.
- **Atributos de esbirro**: PLA (Planificación), ATQ (Ataque), Vida.
- **Atributos de plan secundario**: Amenaza inicial (usar `startingThreat: [X, true]` para indicar amenaza "por jugador" `[v]`), Iconos en el objeto `icons` (ej: `icons: {hazard: 1}`).
- **Texto de Aumento (Boost)**: Valor numérico o iconos (estrellas/recursos).
- **Capacidades**: "Cuando se muestre esta carta" (When Revealed), "Cuando se derrote esta carta" (When Defeated), Respuesta obligada, etc.

Nota: El formato del usuario es la fuente de verdad y puede variar ligeramente; el asistente debe ser flexible al interpretar los campos descriptivos. Si no se indica explícitamente un rasgo para una carta de encuentro, se asume que no tiene ninguno. Si una palabra aparece entre `<>` (ej: `<Vengador>`), debe ser tratada como un rasgo de la carta.

### Reglas de Implementación de Código
- **Restricciones de Objetivo (Validation)**: Cuando una carta "no puede ser objetivo" de ciertos efectos (como el daño de mejoras específicas), se debe añadir un objeto `validation` dentro de la capacidad constante de la carta. Este objeto define las condiciones que el motor de selección consultará para excluir a la carta de la lista de objetivos válidos.
- **"No puede" (Cannot)**: Las capacidades que indican que algo "no puede" ocurrir son absolutas. Deben implementarse como capacidades constantes o interrupciones obligadas que cancelan/previenen el efecto original (usando `validation` para objetivos o efectos preventivos para resultados), SIN usar `EFFECT_MAY` o cualquier componente opcional.
- **Estructura de Cartas de Escenario**: Para cartas de encuentro de archienemigo, utiliza la estructura de `CARD_TYPE_SIDE_SCHEME_SCENARIO`, `CARD_TYPE_MINION`, `CARD_TYPE_TREACHERY`, etc., con los parámetros dentro de un objeto `params`.
- **Iconos de Plan**: Los iconos de riesgo, aceleración, etc., en planes secundarios deben definirse en el objeto `icons` (ej: `icons: {hazard: 1}`).
- **Nombres de Variables**: Los nombres de las constantes/variables que contienen los objetos de las cartas deben escribirse en **inglés** (camelCase), independientemente de que el nombre visible de la carta esté en español.
- **Registro de Archienemigos**: Las cartas pertenecientes al conjunto de archienemigo deben añadirse al array `nemesis` dentro del archivo `index.js` del héroe correspondiente.

## Instrucciones de Desarrollo

1. **Composición de Efectos**: Al implementar la lógica de una carta, **NO** crees efectos específicos que resuelvan literalmente el texto de una sola carta (ej. `MoverCartaDePanteraNegraDelMazoALaManoYBarajarEffect`). En su lugar, utiliza y combina efectos genéricos y modulares (ej. `SearchCardsEffect`, `MoveToHandEffect`, `ShuffleDeckEffect`).
2. **Efectos Genéricos**: Si la funcionalidad requerida no existe, puedes crear un nuevo efecto, pero este debe ser diseñado de forma **genérica** para que pueda ser reutilizado por otras cartas en el futuro.
3. **Encadenamiento**: Utiliza `EFFECT_CHAINED` para secuenciar múltiples efectos genéricos y lograr comportamientos complejos.
