# Guía de presentación de cartas y modales

Consulta esta guía al cambiar componentes de cartas, descartes o diálogos que las muestran.

## Orientación y composición

- Muestra las cartas de plan en horizontal en todos los modales.
- Al mostrar una carta de plan en un descarte, rota su imagen 90 grados hacia la izquierda.
- En el plan principal, coloca las etiquetas de umbral de amenaza y etapa en la cabecera, encima de la imagen, alineadas con el nombre y dentro de los límites laterales de la imagen. Si el nombre ocupa varias líneas, alinea las etiquetas por abajo.
- En los diálogos que muestran el plan principal, usa el título `Mostrando el Plan principal`. En el diálogo de etapa completada, conserva el nombre del plan y la etapa en el título (por ejemplo, `Nombre del plan (1B)`) e indica ese estado en el subtítulo.
- Mantén visibles los contadores vinculados a una carta en las zonas y modales donde se presenta. Conserva el dato `counters` durante la serialización y pásalo al componente como propiedad reactiva.
- Antes de serializar una actualización visual, completa los cálculos que puedan modificar los rasgos, palabras clave o estadísticas mostrados. Usa el estado posterior a esos cálculos tanto en refrescos incrementales como en las instantáneas de partida; comprueba también el primer refresco después de cambiar de identidad sin recargar la página.
- En personajes, muestra debajo de la imagen y de los rasgos adquiridos las palabras clave que hayan ganado y no estén impresas en su propio texto. Usa una tipografía distinta a la de los rasgos y no repitas las palabras clave impresas.
- Representa las cartas de personaje boca abajo usando el dorso de una carta de jugador, sin serializar ni mostrar el nombre o la imagen de la carta que hay debajo.

## Revelación y resolución

- Durante la preparación, muestra la etapa 1A antes de resolver su capacidad de Preparación y la etapa 1B antes de resolver sus capacidades «Cuando se muestre esta carta».
- Cuando un efecto de descarte hasta pone un esbirro en juego desde el descarte del mazo de Encuentros, muestra su carta después de que entre en juego; no resuelvas capacidades «Cuando se muestre esta carta» por este aviso.
- Al completar una etapa del plan principal, muestra primero el diálogo de etapa completada. Si la partida continúa, muestra la cara A antes de resolver sus capacidades «Cuando se muestre esta carta» y después la cara B antes de resolver las suyas. No abras diálogos informativos adicionales por cada capacidad ni añadas una opción `showDialog` a la configuración de cartas para controlar este comportamiento.
- Al revelar un villano, titula el diálogo `Mostrando al villano`. Al derrotar una etapa de villano, muestra un diálogo que anuncie su derrota antes de revelar la etapa siguiente o terminar la partida.
- Al repartir varias cartas de aumento, muestra todas boca abajo en un único diálogo inicial. Después, cada confirmación revela y resuelve la siguiente carta de izquierda a derecha. Mantén visibles los iconos de cada carta y si tiene capacidad de aumento; muestra también la suma acumulada de los iconos ya revelados. Continúa con el ataque o el plan solo después de resolverlas todas.
- Si una activación se omite por Aturdimiento o Confusión, indica el estado con el diálogo correspondiente y muestra la imagen de la carta de estado adecuada.
