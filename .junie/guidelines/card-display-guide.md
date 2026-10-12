# Guía de presentación de cartas y modales

Consulta esta guía al cambiar componentes de cartas, descartes o diálogos que las muestran.

## Texto con iconos

- Para renderizar texto de interfaz que incluya códigos de icono entre corchetes, usa `renderTextWithIcons` de `mc-frontend/src/utils/render-text-with-icons.js`. Convierte los códigos compatibles con `mc-icon` en iconos y conserva literalmente los códigos desconocidos.

## Orientación y composición

- En listas que muestran la jugabilidad, resalta las cartas con `playable === true` con un halo amarillo difuminado alrededor de la imagen solamente; no reduzcas el brillo de las cartas no jugables. Conserva el tratamiento de deshabilitado temporal para acciones pendientes.
- Resalta la pila de descartes del jugador cuando contenga cartas que puedan jugarse desde ella y resalta esas cartas en el diálogo del descarte. No resaltes las pilas de otros jugadores.
- Muestra junto al superhéroe los accesorios vinculados a él; las mejoras vinculadas ya se muestran con el resto de las mejoras y no deben duplicarse.
- Representa las cartas metidas debajo —bocarriba, no como cartas boca abajo— con una pequeña pestaña bajo su anfitrión que muestre el borde inferior de cada carta. Al pulsar el anfitrión, muestra todas en un diálogo; si también tiene acciones, incluye «Ver cartas metidas debajo» en el menú de acciones.
- Calcula como cero las estadísticas no impresas indicadas por `unprintedStats`, pero muéstralas con una estrella compacta de la fuente Marvel Champions mientras su valor efectivo siga siendo cero. Centra los valores en indicadores compactos y alinea verticalmente la estrella.
- Muestra las cartas de plan en horizontal en todos los modales.
- Al mostrar una carta de plan en un descarte, rota su imagen 90 grados hacia la izquierda.
- En el plan principal, coloca las etiquetas de umbral de amenaza y etapa en la cabecera, encima de la imagen, alineadas con el nombre y dentro de los límites laterales de la imagen. Si el nombre ocupa varias líneas, alinea las etiquetas por abajo.
- En los diálogos que muestran el plan principal, usa el título `Mostrando el Plan principal`. En el diálogo de etapa completada, conserva el nombre del plan y la etapa en el título (por ejemplo, `Nombre del plan (1B)`) e indica ese estado en el subtítulo.
- Mantén visibles los contadores vinculados a una carta en las zonas y modales donde se presenta. Conserva el dato `counters` durante la serialización y pásalo al componente como propiedad reactiva.
- En el diálogo para elegir cartas que ya están en juego para descartarlas, muestra las etiquetas de contadores y vida disponibles en cada carta.
- En el diálogo de reparto de daño indirecto, muestra la vida restante, los puntos de vida máximos efectivos y las cartas de estado de cada personaje seleccionable. Calcula los puntos de vida efectivos antes de serializar las cartas.
- En el diálogo para elegir defensor, muestra la vida restante y los puntos de vida máximos efectivos de cada defensor. Calcula los puntos de vida efectivos antes de serializar las cartas.
- Muestra los aumentos pendientes vinculados al Villano con el dorso de Encuentros, sin revelar su cara. Agrupa los dorsos y muestra un contador solo cuando haya más de una carta; una carta no lleva etiqueta numérica.
- Antes de serializar una actualización visual, completa los cálculos que puedan modificar los rasgos, palabras clave o estadísticas mostrados. Usa el estado posterior a esos cálculos tanto en refrescos incrementales como en las instantáneas de partida; comprueba también el primer refresco después de cambiar de identidad sin recargar la página.
- En personajes, muestra debajo de la imagen y de los rasgos adquiridos las palabras clave que hayan ganado y no estén impresas en su propio texto. Usa una tipografía distinta a la de los rasgos y no repitas las palabras clave impresas.
- Representa las cartas de personaje boca abajo usando el dorso de una carta de jugador, sin serializar ni mostrar el nombre o la imagen de la carta que hay debajo.

## Revelación y resolución

- Durante la preparación, muestra la etapa 1A antes de resolver su capacidad de Preparación y la etapa 1B antes de resolver sus capacidades «Cuando se muestre esta carta».
- Cuando un efecto de descarte hasta pone un esbirro en juego desde el descarte del mazo de Encuentros, muestra su carta después de que entre en juego; no resuelvas capacidades «Cuando se muestre esta carta» por este aviso.
- Al completar una etapa del plan principal, muestra primero el diálogo de etapa completada. Si la partida continúa, muestra la cara A antes de resolver sus capacidades «Cuando se muestre esta carta» y después la cara B antes de resolver las suyas. No abras diálogos informativos adicionales por cada capacidad ni añadas una opción `showDialog` a la configuración de cartas para controlar este comportamiento.
- Al revelar un villano, titula el diálogo `Mostrando al villano`. Al derrotar una etapa de villano, muestra un diálogo que anuncie su derrota antes de revelar la etapa siguiente o terminar la partida.
- Al repartir varias cartas de aumento, muestra todas boca abajo en un único diálogo inicial. Después, cada confirmación revela y resuelve la siguiente carta de izquierda a derecha. Representa los iconos de aumento impresos y los acumulados repitiendo `ICON_BOOST` (`b`) una vez por icono, sin mostrar la etiqueta de iconos cuando el recuento sea cero. Mantén visible si la carta tiene capacidad de aumento. Continúa con el ataque o el plan solo después de resolverlas todas.
- En el diálogo de encuentros repartidos, conserva el texto literal que explica las cartas adicionales y coloca sobre la carta y el nombre de cada jugador un icono de riesgo de la fuente de Marvel Champions (`ICON_HAZARD`, carácter `H`) por cada carta adicional que reciba. Usa un tamaño mayor al normal; las cartas de encuentro siguen boca abajo.
- Si una activación se omite por Aturdimiento o Confusión, indica el estado con el diálogo correspondiente y muestra la imagen de la carta de estado adecuada.
