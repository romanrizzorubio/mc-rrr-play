# Guía de presentación de cartas y modales

Consulta esta guía al cambiar componentes de cartas, descartes o diálogos que las muestran.

## Texto con iconos

- Para renderizar texto de interfaz que incluya códigos de icono entre corchetes, usa `renderTextWithIcons` de `mc-frontend/src/utils/render-text-with-icons.js`. Convierte los códigos compatibles con `mc-icon` en iconos y conserva literalmente los códigos desconocidos.

## Orientación y composición

- En listas que muestran la jugabilidad, resalta las cartas con `playable === true` con un halo amarillo difuminado alrededor de la imagen solamente; no reduzcas el brillo de las cartas no jugables. Conserva el tratamiento de deshabilitado temporal para acciones pendientes.
- Resalta la pila de descartes del jugador cuando contenga cartas que puedan jugarse desde ella y resalta esas cartas en el diálogo del descarte. No resaltes las pilas de otros jugadores.
- Muestra junto al superhéroe los accesorios vinculados a él; las mejoras vinculadas ya se muestran con el resto de las mejoras y no deben duplicarse.
- En los diálogos de lista, pasa la carta de contexto en `data.card` para mostrar su imagen; si no hay una carta con imagen ni un dorso, no renderices una carta vacía.
- Representa las cartas metidas debajo —bocarriba, no como cartas boca abajo— con una pequeña pestaña bajo su anfitrión que muestre el borde inferior de cada carta. Al pulsar el anfitrión, muestra todas en un diálogo; si también tiene acciones, incluye «Ver cartas metidas debajo» en el menú de acciones.
- Calcula como cero las estadísticas no impresas indicadas por `unprintedStats`, pero muéstralas con una estrella compacta de la fuente Marvel Champions mientras su valor efectivo siga siendo cero. Centra los valores en indicadores compactos y alinea verticalmente la estrella.
- Muestra las cartas de plan en horizontal en todos los modales.
- Al mostrar una carta de plan en un descarte, rota su imagen 90 grados hacia la izquierda.
- En el plan principal, coloca las etiquetas de umbral de amenaza y etapa en la cabecera, encima de la imagen, alineadas con el nombre y dentro de los límites laterales de la imagen. Si el nombre ocupa varias líneas, alinea las etiquetas por abajo.
- En los diálogos que muestran el plan principal, usa el título `Mostrando el Plan principal`. En el diálogo de etapa completada, conserva el nombre del plan y la etapa en el título (por ejemplo, `Nombre del plan (1B)`) e indica ese estado en el subtítulo.
- Al pulsar un enemigo, ofrece un ataque básico del superhéroe actual; al pulsar un plan, ofrece una intervención básica. Solo muestra esas opciones si el backend confirma que la carta concreta es un objetivo válido para ese jugador. Si es la única acción, abre directamente una confirmación cuyo título pregunta por el ataque o la intervención y no muestra subtítulo; presenta las cartas del superhéroe y el objetivo sin etiquetas ni una línea de tipo de activación. Si hay otras acciones disponibles, muestra un menú con la activación básica primero. La casilla para ocultar la confirmación debe recordarse para ese jugador y esa partida. Revalida en el servidor el objetivo seleccionado antes de resolver y no reacciones al clic de activación si no hay objetivo válido.
- En el diálogo de activación de un enemigo, muestra los atributos disponibles de ambos personajes con la presentación estándar de las cartas, sin añadir etiquetas de texto. En una ejecución del Plan, muestra al jugador afectado como segundo personaje aunque la amenaza se coloque en el plan principal.
- Antes de serializar las cartas del diálogo de activación, calcula las estadísticas efectivas de ambos personajes para que se reflejen sus bonificaciones; conserva el valor de ataque o Plan calculado para esa activación.
- Mantén visibles los contadores vinculados a una carta en las zonas y modales donde se presenta. Conserva el dato `counters` durante la serialización y pásalo al componente como propiedad reactiva.
- En el diálogo para elegir cartas que ya están en juego para descartarlas, muestra las etiquetas de contadores y vida disponibles en cada carta.
- En el diálogo de reparto de daño indirecto, muestra la vida restante, los puntos de vida máximos efectivos y las cartas de estado de cada personaje seleccionable. Calcula los puntos de vida efectivos antes de serializar las cartas.
- En el diálogo para elegir defensor, muestra la vida restante y los puntos de vida máximos efectivos de cada defensor. Calcula los puntos de vida efectivos antes de serializar las cartas.
- Muestra los aumentos pendientes vinculados al Villano con el dorso de Encuentros, sin revelar su cara. Agrupa los dorsos y muestra un contador solo cuando haya más de una carta; una carta no lleva etiqueta numérica.
- Antes de serializar una actualización visual, completa los cálculos que puedan modificar los rasgos, palabras clave o estadísticas mostrados. Usa el estado posterior a esos cálculos tanto en refrescos incrementales como en las instantáneas de partida; comprueba también el primer refresco después de cambiar de identidad sin recargar la página.
- En personajes, muestra debajo de la imagen y de los rasgos adquiridos las palabras clave que hayan ganado y no estén impresas en su propio texto. Usa una tipografía distinta a la de los rasgos y no repitas las palabras clave impresas.
- Representa las cartas de personaje boca abajo usando el dorso de una carta de jugador, sin serializar ni mostrar el nombre o la imagen de la carta que hay debajo.
- En el diálogo de orden, permite recolocar las cartas arrastrándolas y explica que la carta más a la izquierda queda arriba del mazo. Muestra el nombre de cada carta solo en la cabecera de la carta, deja que los nombres largos salten de línea dentro de su ancho y alinea las cartas por su borde inferior.
- En el diálogo de orden de descarte, indica que las cartas se descartan en el orden elegido, que la de la izquierda queda más arriba en la pila y ofrece una casilla para ignorar futuras preguntas sobre ese orden. No muestres esa casilla en la acción que descarta una carta y devuelve las demás al mazo.
- Cuando un efecto descarta una carta y devuelve las demás al mazo, muestra en el mismo diálogo una zona de descarte y otra para ordenar las cartas que vuelven.
- Si un jugador ha visto cartas que siguen en un mazo, muestra sobre ese mazo un icono de ojo que abre la lista de cartas vistas. En diálogos, muestra el ojo para alternar la vista de una carta boca abajo solo si esa carta ya es conocida; no permitas consultar de este modo cartas que aún no se han visto.

## Revelación y resolución

- Durante la preparación, muestra la etapa 1A antes de resolver su capacidad de Preparación y la etapa 1B antes de resolver sus capacidades «Cuando se muestre esta carta».
- Cuando un esbirro del mazo o del descarte del mazo de Encuentros entra en juego, muestra su carta después de que entre en juego; no resuelvas capacidades «Cuando se muestre esta carta» por este aviso.
- Al derrotar un esbirro con una capacidad «Cuando se derrote», muéstrala en el diálogo obligatorio de respuesta antes de resolverla; el diálogo no permite omitirla.
- Al completar una etapa del plan principal, muestra primero el diálogo de etapa completada. Si la partida continúa, muestra la cara A antes de resolver sus capacidades «Cuando se muestre esta carta» y después la cara B antes de resolver las suyas. No abras diálogos informativos adicionales por cada capacidad ni añadas una opción `showDialog` a la configuración de cartas para controlar este comportamiento.
- Al revelar un villano, titula el diálogo `Mostrando al villano`. Al derrotar una etapa de villano, muestra un diálogo que anuncie su derrota antes de revelar la etapa siguiente o terminar la partida.
- Al resolver Oleada, muestra antes de revelar la carta adicional un diálogo que explique la resolución, muestre el dorso de Encuentros y permita ocultar avisos posteriores durante la partida.
- Al repartir varias cartas de aumento, muestra todas boca abajo en un único diálogo inicial. Después, cada confirmación revela y resuelve la siguiente carta de izquierda a derecha. Representa los iconos de aumento impresos y los acumulados repitiendo `ICON_BOOST` (`b`) una vez por icono, sin mostrar la etiqueta de iconos cuando el recuento sea cero. Mantén visible si la carta tiene capacidad de aumento. Si una capacidad de aumento modifica los iconos de su propia carta, vuelve a mostrar el diálogo de esa carta con el título «Aumento actualizado», el recuento actualizado y el subtítulo «Se muestran los iconos de aumento actualizados.»; si hay varias cartas, actualiza también el acumulado. Continúa con el ataque o el plan solo después de resolverlas todas.
- En el diálogo de encuentros repartidos, conserva el texto literal que explica las cartas adicionales y coloca sobre la carta y el nombre de cada jugador un icono de riesgo de la fuente de Marvel Champions (`ICON_HAZARD`, carácter `H`) por cada carta adicional que reciba. Usa un tamaño mayor al normal; las cartas de encuentro siguen boca abajo.
- Si una activación se omite por Aturdimiento o Confusión, indica el estado con el diálogo correspondiente y muestra la imagen de la carta de estado adecuada.
