# Guía de Traducción y Estilo (Skill)

Esta guía contiene las traducciones oficiales y reglas de estilo para la documentación del proyecto. Debe ser consultada antes de realizar cualquier cambio en la documentación para asegurar la consistencia terminológica.

## Diccionario de Traducciones

| Término Original | Traducción Oficial |
| :--- | :--- |
| **encounter group** | conjunto de encuentros |
| **identity** | superhéroe |
| **form** | identidad |
| **hero** | héroe |
| **alter ego** | alter ego |
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

## Instrucciones de Desarrollo

1. **Composición de Efectos**: Al implementar la lógica de una carta, **NO** crees efectos específicos que resuelvan literalmente el texto de una sola carta (ej. `MoverCartaDePanteraNegraDelMazoALaManoYBarajarEffect`). En su lugar, utiliza y combina efectos genéricos y modulares (ej. `SearchCardsEffect`, `MoveToHandEffect`, `ShuffleDeckEffect`).
2. **Efectos Genéricos**: Si la funcionalidad requerida no existe, puedes crear un nuevo efecto, pero este debe ser diseñado de forma **genérica** para que pueda ser reutilizado por otras cartas en el futuro.
3. **Encadenamiento**: Utiliza `EFFECT_CHAINED` para secuenciar múltiples efectos genéricos y lograr comportamientos complejos.
