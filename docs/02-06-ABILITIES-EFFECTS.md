# Capacidades y Efectos

## Sistema de Capacidades (Abilities)
Una capacidad es el texto de juego en una carta que explica lo que la carta hace (o puede hacer).

### Reglas Generales de las Capacidades
- Las capacidades de las cartas solo interactúan con las cartas que están **en juego**, a menos que la capacidad se refiera específicamente a un área o elemento fuera de juego.
- Las capacidades en cartas de héroe, alter-ego, aliado, mejora y apoyo solo pueden usarse si la carta está en juego, a menos que se especifique lo contrario. Las cartas de evento interactúan implícitamente desde fuera del juego.
 - El coste de una capacidad no puede pagarse si el efecto de esa capacidad requiere uno o más objetivos y no hay al menos un objetivo válido. (Véase: [objetivo válido](#objetivo-válido-valid-target)).
- Cuando una capacidad tiene más de una frase de texto, lee la totalidad de la capacidad para verificar efectos de alteración. A continuación, resuelve la capacidad frase por frase.
    - Si el texto del efecto de una capacidad incluye la palabra "**luego**" (then), el texto que precede a la palabra "luego" debe ser totalmente verdadero o resolverse antes de que el resto del efecto descrito después de la palabra "luego" pueda resolverse.
    - Si el texto pre-"luego" de un efecto se resuelve por completo, el texto post-"luego" del efecto también debe intentar resolverse.
    - Si el texto pre-"luego" de un efecto no se resuelve por completo, el texto post-"luego" no intenta resolverse.
- El punto separa frases que se resuelven en el orden escrito. Por sí solo, no hace que una frase dependa de que la anterior se resuelva por completo; esa condición se establece con "luego" u otra instrucción explícita.
- La coma organiza la frase, pero no es por sí sola un operador de tiempo o dependencia. No infieras secuencia, simultaneidad ni una condición de éxito solo por una coma; interpreta las palabras y las cláusulas que conecta.
- Las capacidades de cartas de jugador no pueden resolverse durante la preparación del juego (preparación), a menos que tengan el disparador de tiempo "**Preparación**".

#### "Después de" (After)
La palabra "después de" se refiere a un suceso del juego que acaba de concluir. Muchas capacidades de respuesta utilizan el término "después de" para especificar el momento en el que pueden utilizarse.

#### respuesta (Response)
Una capacidad de respuesta es un tipo de capacidad disparada, indicada por el disparador de tiempo en negrita "**Respuesta**". Las capacidades de respuesta pueden resolverse después de que ocurra la condición de activación especificada, tal como se describe en el texto de la capacidad de respuesta.

- Los jugadores solo pueden activar capacidades de respuesta en las cartas que controlan o en las cartas de encuentro.
    - Los jugadores no pueden activar capacidades de respuesta en las obligaciones que se encuentren en las zonas de juego de otros jugadores.
- Se pueden activar múltiples respuestas a partir de la misma condición de activación, pero cada respuesta solo se puede activar una vez por cada ocurrencia de la condición de activación.
    - Se pueden activar múltiples copias de una carta con una respuesta por la misma condición de activación.
- Si un único efecto hace que se produzcan múltiples condiciones de activación, las respuestas a cada una de esas condiciones de activación pueden resolverse en cualquier orden. (Por ejemplo, si un ataque activa respuestas tanto "después de que ataques" como "después de que derrotes", esas respuestas pueden resolverse en cualquier orden).
- Una vez que todos los jugadores deciden que no desean resolver ninguna respuesta (adicional) a una condición de activación, ya no se pueden usar más respuestas a esa instancia de esa condición de activación.

**Véase también**: capacidad, capacidad disparada, condición de activación.

#### "Adicional" (Additional)
**Véase**: Efecto de Alteración.

#### "Y" (And)
La palabra "y" indica que dos o más efectos dentro de una capacidad se resuelven simultáneamente.

- Los efectos individuales conectados por "y" no son dependientes entre sí. Resuelve la mayor parte de cada efecto que sea posible.
- Cada efecto conectado por "y" puede ser cancelado o evitado de forma independiente.
- Esta regla se aplica cuando "y" conecta efectos; una lista de elementos u objetivos no crea por sí sola un efecto separado para cada sustantivo.

**Véase también**: capacidad, cancelar, evitar.

#### "Cada jugador" (Each Player)
Cuando se instruye a cada jugador a resolver un efecto, cada jugador resuelve ese efecto uno a la vez.

- Si el efecto no especifica en qué orden los jugadores resuelven el efecto, el primer jugador decide el orden.
- Si un jugador no puede resolver completamente ese efecto, lo resuelve lo más completamente posible. Por ejemplo, si se instruye a cada jugador a descartar un cierto número de cartas del mazo de encuentros y el mazo se vacía mientras un jugador está descartando de él, ese jugador deja de descartar tan pronto como el mazo se vacía. Después de reiniciar el mazo (y colocar una ficha de aceleración junto al mazo del plan principal), los jugadores restantes reanudan el descarte de este.

**Véase también**: elegir (elemento de juego), jugador.

#### "Por cada" (For Each)
"Por cada" indica que un efecto se repite según el número de un elemento de juego contable.

- Si un efecto con "por cada" requiere un objetivo, ese efecto se aplica a un solo objetivo a menos que la cláusula "por cada" incluya una instrucción de "elegir".
    - Por ejemplo, un efecto que dice "Por cada perfidia mirada de esta manera, quita 1 de amenaza de un plan" quita amenaza de un solo plan.
    - Alternativamente, un efecto que dice "Por cada mejora que controles, elige un enemigo e inflígele 2 de daño" te permite elegir un enemigo diferente por cada mejora que controles.
- Si un efecto "por cada" sin una instrucción de "elegir" inflige daño o quita amenaza, se considera una única instancia de daño infligido o amenaza quitada, respectivamente.
- Si un efecto "por cada" tiene una instrucción de "elegir", cada iteración de esa elección se considera una instancia separada de ese efecto, incluso si se elige el mismo objetivo múltiples veces.
    - El estado del juego se actualiza después de cada instancia (por ejemplo, si un esbirro o plan secundario es derrotado).
    - Las respuestas pueden dispararse después de cada instancia.
    - Por ejemplo, si un jugador está enfrentado a un esbirro con guardia y usa un efecto que dice "por cada recurso gastado de esta manera, elige un enemigo e inflígele 2 de daño", ese jugador puede derrotar al esbirro con guardia con una instancia de 2 de daño, convirtiendo al villano en un objetivo válido para las siguientes instancias. Ese jugador puede disparar una capacidad de respuesta como "Después de infligir daño a un enemigo" después de cada instancia.
- Si otra capacidad modifica un efecto "por cada", ese modificador se aplica a cada instancia del efecto "por cada". (Por ejemplo, *Aluvión de Hojas* es un evento que tiene el efecto: "Por cada Katana Psi, elige un enemigo e inflígele 2 de daño". Si es modificado por un efecto que dice "ese evento inflige 1 de daño adicional", *Aluvión de Hojas* inflige 3 de daño a cada enemigo elegido).

**Véase también**: capacidad, objetivo.

#### "Cancelar" (Cancel)
Algunas capacidades de cartas pueden cancelar efectos de cartas o del juego.

- Las capacidades de cancelación interrumpen el inicio de los efectos y evitan que se resuelvan.
- Cada vez que se cancelan los efectos de una capacidad, la capacidad (independientemente de sus efectos) se sigue considerando iniciada y se siguen pagando todos los costes. Solo se evita que los efectos se iniciien y no se resuelven.
- Si se cancelan los efectos de una carta de evento, la carta se sigue considerando jugada y se descarta.
- Si se cancelan los efectos de una carta de perfidia, la carta se sigue considerando mostrada y se sigue colocando en la pila de descartes de encuentros.
- Los efectos de cancelación se consideran un subtipo de efecto de reemplazo, donde el efecto cancelado se reemplaza por ningún efecto.
    - Las capacidades que dependen del efecto cancelado no pueden dispararse, ya que el efecto cancelado no se considera ocurrido.

**Véase también**: capacidad, efecto de reemplazo.

#### "No puede" (Cannot)
La palabra "no puede" es absoluta y no puede ser revocada por otras capacidades o efectos.

- Si dos capacidades entran en conflicto, la capacidad con "no puede" tiene precedencia.
- Si dos reglas entran en conflicto, la regla con "no puede" tiene precedencia.
- Una capacidad puede anular una regla con "no puede" según las Reglas de Oro.

**Véase también**: Reglas de Oro, objetivo.

#### "en caso contrario" (Otherwise)
Los efectos que comienzan con "en caso contrario" solo se resuelven si el efecto precedente no se resolvió.

- Un efecto "en caso contrario" se resolverá si se cumple uno o más de los siguientes puntos en relación al efecto precedente:
    - Tiene una condición que no es verdadera. (Por ejemplo, una capacidad dice: "Si estás en identidad de héroe, sufre 2 de daño. En caso contrario, coloca 2 de amenaza en el plan principal". La parte "en caso contrario" se resuelve si el jugador no está en identidad de héroe).
    - Tiene un efecto que no puede resolverse al menos parcialmente. (Por ejemplo, una capacidad dice: "Descarta 2 cartas de tu mano. En caso contrario, agota tu superhéroe". La parte "en caso contrario" se resuelve si el jugador no puede descartar al menos 1 carta de su mano).
- Si "en caso contrario" va precedido de un punto y coma, el "efecto precedente" se refiere a los efectos anteriores al punto y coma en la misma frase. Si el efecto "en caso contrario" es su propia frase, el "efecto precedente" se refiere a la frase que viene directamente antes de la frase "en caso contrario".

**Véase también**: efecto de reemplazo, objetivo.

#### "vaya a" (Haría / Would)
La palabra "vaya a" (o "haría" / *would*) se utiliza para definir la condición de activación de algunas capacidades de interrupción, y establece una prioridad de tiempo más alta para esas capacidades que las interrupciones a la misma condición de activación sin la palabra "vaya a".

- Si una interrupción a una condición de activación que "vaya a" ocurrir cambia la naturaleza de lo que está a punto de ocurrir (como a través de un efecto de reemplazo), no se pueden usar más interrupciones al activador original ya que la resolución de ese activador ya no es válida.
- Por ejemplo, una interrupción que diga "cuando un personaje vaya a ser derrotado" se dispara antes que una interrupción que diga "cuando un personaje sea derrotado".

**Véase también**: interrupción, efecto de reemplazo, capacidad disparada.

#### intercambiar (Swap)
Una instrucción para "intercambiar" dos componentes significa intercambiar la ubicación de esos dos componentes.

- Un intercambio no puede completarse si no hay un componente en ambas ubicaciones.
    - Por ejemplo, no puedes "intercambiar una carta de tu mano con la carta superior de tu mazo" si no tienes cartas en la mano.
- Las cartas intercambiadas mantienen la orientación (como preparada o agotada, bocarriba o boca abajo) de la carta original.
- Intercambiar una carta en la mano con la carta superior de un mazo no se considera robar esa carta.
- Al intercambiar una carta en una zona de juego con una carta en una zona fuera de juego, si esas dos cartas:
    - **Comparten un título**: ninguna de las dos cartas se considera que entra o abandona el juego. Las fichas, cartas vinculadas, cartas metidas debajo y cartas de estado de la carta que estaba previamente en juego se transfieren a la otra carta, y la otra carta mantiene el estado (preparada o agotada) de la carta que estaba previamente en juego. Si la carta intercambiada tiene un dial de puntos de vida asociado, ese dial permanece en el mismo valor.
    - **No comparten un título**: la carta en juego se considera que abandona el juego y la carta fuera de juego se considera que entra en juego. Las fichas, cartas vinculadas, cartas metidas debajo y cartas de estado de la carta que estaba previamente en juego no se transfieren a la otra carta y la otra carta entra en juego preparada. Si la carta intercambiada tiene un dial de puntos de vida asociado, ese dial se reinicia al valor de puntos de vida impreso de la nueva carta.

**Véase también**: capacidad, objetivo.

#### iniciación de capacidades (Initiating Abilities)
Cuando un jugador desea jugar una carta o iniciar una capacidad disparada, ese jugador declara primero su intención. Luego, el jugador comprueba las siguientes condiciones en orden:

1. Si juega una carta, el jugador coloca esa carta boca arriba en la mesa frente a él. (Esta carta no está en juego).
2. Comprobar las restricciones de juego: ¿se puede jugar la carta, o iniciar la capacidad, en este momento?
    - Si hay que elegir uno o más objetivos para la carta o capacidad, el jugador los elige ahora, antes de determinar y pagar los costes. Si no hay al menos un objetivo válido, no se puede jugar ni iniciar.
    - Si la carta o capacidad tiene un requisito de identidad (por ejemplo, "Solo identidad de héroe" o "Acción de Héroe"), se comprueba ahora la identidad (form) del jugador que juega esa carta o inicia esa capacidad.
3. Determinar el coste (o costes) para jugar la carta o iniciar la capacidad y la aptitud del jugador para pagarlos, teniendo en cuenta los modificadores.
    - Si una carta tiene un coste de recursos de X, el jugador que juega esa carta elige el valor de X durante este paso.

Si se cumplen ambas condiciones, sigue estos pasos en orden:
4. Aplicar cualquier modificador al coste(s).
5. Pagar el coste(s). Si se llega a este paso y no se puede pagar el coste(s), aborta este proceso sin pagar ningún coste.
6. La carta comienza a ser jugada, o los efectos de la capacidad intentan iniciarse.
7. La carta se juega o la capacidad (si no se canceló en el paso anterior) se resuelve. La carta entra en juego o, si es una carta de evento, sus efectos se resuelven y luego se coloca en la pila de descartes de su propietario.

- Si cualquiera de los pasos anteriores hiciera que la condición de activación de una capacidad de interrupción fuera verdadera, esa capacidad puede iniciarse justo antes de que esa condición de activación se vuelva verdadera.
- Si cualquiera de los pasos anteriores hiciera que la condición de activación de una capacidad de respuesta fuera verdadera, esa capacidad puede iniciarse inmediatamente después de que esa condición de activación se vuelva verdadera.
- Si la capacidad que se está iniciando está en una carta que está en juego, la secuencia no deja de completarse si esa carta abandona el juego durante esta secuencia, a menos que la salida de la carta del juego impida el pago de un coste requerido.

**Véase también**: capacidad, coste, restricciones y permisos de juego, objetivo.

#### calificadores (Qualifiers)
Si el texto de una capacidad incluye un calificador seguido de múltiples términos, el calificador se aplica a cada elemento de la lista, si es aplicable.

Por ejemplo, en la frase "cada personaje y accesorio preparado", la palabra "preparado" se aplica tanto a "personaje" como a "accesorio".

**Véase también**: capacidad.

#### "en vez de eso" (Instead)
El término "en vez de eso" indica un efecto de reemplazo. Un efecto de reemplazo reemplaza la resolución de un suceso del juego por un suceso diferente.

#### efecto de reemplazo (Replacement Effect)
Un efecto de reemplazo reemplaza un efecto especificado por un efecto diferente. La mayoría de los efectos de reemplazo son capacidades de interrupción con el formato "cuando [condición de activación] fuera a ocurrir, haz [efecto de reemplazo] **en vez de eso**".

- Cuando un efecto es reemplazado, ya no se considera inminente y no se pueden disparar más interrupciones o respuestas a ese efecto.
- El efecto reemplazado no se resuelve además del efecto que lo reemplaza.

**Véase también**: capacidad, efecto de alteración, cancelar, interrupción, "en caso contrario", capacidad disparada, ["vaya a" (haría)](#vaya-a-haría--would).


#### interrupción (Interrupt)
Una capacidad de interrupción es un tipo de capacidad disparada, indicada por el disparador de tiempo en negrita "**Interrupción**". Las capacidades de interrupción pueden resolverse en cualquier momento en que ocurra la condición de activación especificada, como se describe en el texto de la capacidad de interrupción. La capacidad de interrupción interrumpe la resolución de la condición de activación especificada y se resuelve inmediatamente antes de que se resuelva dicha condición de activación.

- Los jugadores solo pueden disparar capacidades de interrupción en las cartas que controlan o en las cartas de encuentro.
    - Los jugadores no pueden disparar capacidades de interrupción en las obligaciones en las áreas de juego de otros jugadores.
- Múltiples interrupciones pueden ser disparadas por la misma condición de activación, pero cada interrupción solo puede ser disparada una vez por cada ocurrencia de la condición de activación.
    - Múltiples copias de una carta con una interrupción pueden ser disparadas por la misma condición de activación.
- Una capacidad de interrupción se resuelve cuando su condición de activación se inicia, pero antes de que dicha condición de activación se resuelva.
    - Las interrupciones que usan la palabra "vaya a" (would) se resuelven antes de que se inicie su condición de activación, cuando esa condición se vuelve inminente.
- Si una interrupción cambia (a través de un efecto de reemplazo) o cancela una condición de activación inminente, no se pueden disparar más interrupciones a la condición de activación original.
- Una vez que todos los jugadores deciden que no desean resolver ninguna interrupción (adicional) a una condición de activación, no se pueden usar más interrupciones para esa instancia de esa condición de activación.

**Véase también**: cancelar, efecto de reemplazo, capacidad disparada, "vaya a" (would).

#### efecto postergado (delayed effect)
Algunas capacidades contienen efectos postergados. Dichas capacidades especifican un momento futuro, o indican una condición futura que puede surgir, y dictan un efecto que debe suceder en ese momento.

- Los efectos postergados se resuelven de forma automática e inmediata después de que ocurra el momento especificado o la condición futura ocurra o se vuelva verdadera, y antes de que se puedan usar respuestas a ese momento o condición.
    - Los efectos postergados tienen la misma prioridad de tiempo que los efectos constantes.
- Cuando se resuelve un efecto postergado, no se trata como una nueva capacidad disparada, incluso si el efecto postergado fue creado originalmente por una capacidad disparada.

**Véase también**: capacidad.

#### elegir (elemento de juego) (Choose)
La frase "elige un [elemento de juego]" (como un aliado, un esbirro o un plan) indica que un jugador debe seleccionar un elemento de juego que cumpla con los requisitos específicos de una capacidad.

- El jugador que resuelve la capacidad que utiliza la palabra "elige" es el jugador que realiza la elección especificada por la carta.
- Si la capacidad de una carta de jugador requiere la elección de uno o más objetivos, y no hay objetivos válidos para ninguna parte de la capacidad, la capacidad no puede iniciarse.
- Si el mismo jugador debe elegir múltiples objetivos, elige simultáneamente tantos como haya disponibles, hasta un máximo del número especificado.
    - El mismo objetivo no puede ser elegido múltiples veces de esta manera.
- Un efecto que puede elegir "cualquier número" de objetivos no se resuelve con éxito si se eligen cero de esos objetivos.

**Véase también**: capacidad, elemento de juego, jugador, objetivo, objetivo válido.

#### objetivo válido (Valid Target)
**Véase**: [objetivo](02-05-ACTIVATION-COMBAT.md#objetivo-target).

#### elegir (opción) (Choose)
Algunas capacidades instruyen a un jugador a elegir entre múltiples opciones. Por ejemplo: "Elige entre sufrir 1 de daño o descartar 1 carta de tu mano".

- Cuando una carta de encuentro requiere que un jugador elija una opción, no puede elegir una opción que requiera uno o más objetivos si no hay objetivos válidos para esa opción.
- Cuando una carta de jugador requiere que un jugador elija una opción, no puede elegir una opción que no pueda resolverse al menos parcialmente. Esto incluye opciones que:
    - Tengan un coste que el jugador no pueda pagar.
    - Requieran uno o más objetivos y no haya objetivos válidos.
- Cuando una carta requiere que un jugador elija múltiples opciones de una lista, ese jugador no puede elegir la misma opción múltiples veces.

**Véase también**: capacidad, jugador, objetivo.

#### capacidad etiquetada (Labeled Ability)
Una capacidad etiquetada es una capacidad disparada con un paréntesis que sigue a su disparador en negrita y que designa esa capacidad como un ataque, defensa y/o intervención.

- La identidad del jugador que usa la capacidad etiquetada se considera que está realizando el efecto etiquetado cuando la capacidad etiquetada comienza a resolverse (después de que se hayan pagado los costes).
- Cuando un jugador resuelve una capacidad etiquetada como "(ataque)", esa capacidad se considera un ataque realizado por el superhéroe de ese jugador.
- Cuando un jugador resuelve una capacidad etiquetada como "(defensa)", esa capacidad se considera una defensa realizada por el superhéroe de ese jugador.
    - Cuando dicha capacidad se inicia durante un ataque, el superhéroe del jugador se convierte en el defensor de ese ataque.
- Cuando un jugador resuelve una capacidad etiquetada como "(intervención)", esa capacidad se considera una intervención realizada por el superhéroe de ese jugador.
- Cuando un jugador resuelve una capacidad con múltiples etiquetas, esa capacidad se considera de cada uno de los tipos de capacidad etiquetados, todos realizados por el superhéroe de ese jugador.
- Si un jugador dispara una capacidad etiquetada mientras su superhéroe tiene una o más cartas de estado que cancelan cualquiera de los tipos de capacidad etiquetados, toda la capacidad (excepto sus costes) se cancela.
    - Ese superhéroe no se considera que haya atacado, defendido o intervenido.
    - Cada carta de estado en el superhéroe del jugador que cancela cualquiera de los tipos de la capacidad etiquetada se quita cuando esa capacidad se cancela. Por ejemplo, una capacidad etiquetada como "(ataque/intervención)" quitaría tanto un estado de confundido como un estado de aturdido del superhéroe del jugador que disparó la capacidad.

**Véase también**: ataque (tipo de capacidad del jugador), defender, intervención.

#### efectos duraderos (Lasting Effects)
Algunas capacidades de cartas crean efectos o condiciones que afectan al juego durante una duración especificada (como "hasta el final de la fase" o "hasta el final de este ataque"). Dichos efectos se conocen como efectos duraderos.

- Un efecto duradero persiste más allá de la resolución de la capacidad que lo creó, durante la duración especificada por el efecto. El efecto continúa afectando al juego durante la duración especificada, independientemente de si la carta que creó el efecto duradero está en juego.
- Durante la duración especificada de un efecto duradero, este se trata como si fuera una capacidad constante y tiene la misma prioridad de tiempo que una capacidad constante.
- Los efectos duraderos se envían y actualizan cada vez que se actualiza el estado del juego. (Por ejemplo, un efecto duradero de "hasta el final de la fase, tu héroe obtiene +1 ATQ por cada esbirro en juego" cambia el ATQ del héroe afectado cada vez que un esbirro entra o abandona el juego durante esa fase).
- Si una carta entra en juego (o cambia de estado para cumplir con los criterios de un conjunto especificado de cartas afectadas) después de la creación de un efecto duradero, sigue estando afectada por ese efecto duradero.
- Un efecto duradero expira tan pronto como se alcanza el punto de tiempo especificado por su duración. Esto significa que un efecto duradero de "hasta el final de la ronda" expira justo antes de que se inicie una capacidad de "al final de la ronda" o un efecto postergado.
- Un efecto duradero que expira al final de un periodo de tiempo especificado solo puede iniciarse durante ese periodo de tiempo.

**Véase también**: capacidad, entrar en juego.

#### límite (Limit)
"Límite X por [periodo]" es un límite que aparece en algunas cartas de jugador. Estos límites son específicos de la carta. Cada copia de una capacidad con dicho límite puede usarse X veces por el periodo especificado, por instancia de esa capacidad.

- Si un efecto con un límite se cancela, la carta se sigue considerando que ha sido jugada o la capacidad iniciada, y cuenta para el límite.

**Véase también**: carta de jugador.

#### máximo (Max, Maximum)
Las palabras "máximo" e "imponen" un máximo en todas las copias de una carta (por título) para todos los jugadores.

- "**Máximo X por [periodo]**" impone un número máximo de veces que se pueden jugar copias de esa carta durante el periodo de tiempo designado.
    - Si una carta con un máximo se cancela, la carta se sigue contando para el máximo.
- "**Máximo X por mazo**" restringe el número de copias de esa carta que pueden incluirse en cada mazo de jugador.
- "**Máximo 1 por jugador**" es específico del jugador y restringe el número de copias de esa carta que cada jugador puede controlar en juego en un momento dado.
    - Un jugador no puede tomar el control de otra copia de una carta de "Máximo 1 por jugador" que ya controle.
- "**Máximo 1 por [elemento de juego]**" restringe el número de copias de esa carta que se pueden vincular a cada elemento de juego indicado. (Por ejemplo, si una mejora es "Máximo 1 por aliado", un aliado puede tener como máximo una copia de esa mejora vinculada).
- "**Máximo 1 por [instancia]**" restringe el número de veces que una capacidad puede ser disparada por una única instancia de un efecto disparador en todas las copias de la carta con el máximo. (Por ejemplo, si una capacidad tiene el texto "(Máximo 1 por evento)", solo se puede disparar una carta con esa capacidad por cada evento jugado).
- El paréntesis "**(hasta un máximo de [valor])**" dentro de una capacidad impone un máximo a esa capacidad durante la duración de la misma.

**Véase también**: cancelar, límite, Apéndice I: Personalización del mazo.

#### resolución simultánea (Simultaneous Resolution)
Si dos o más efectos con el mismo disparador de tiempo en negrita se resolvieran simultáneamente, el primer jugador determina el orden en el que se resuelven los efectos.

**Véase también**: "cada jugador", capacidad disparada.

#### "puede" (May)
La palabra "puede" indica que un jugador especificado tiene la opción de resolver el texto que sigue. Si no se especifica ningún jugador, la opción se concede al controlador de la carta con la capacidad en cuestión.

**Véase también**: jugador.

#### Especial (Special)
Una capacidad especial es un tipo de capacidad disparada, indicada por el disparador de tiempo en negrita "**Especial**". Las capacidades especiales solo pueden resolverse mediante la instrucción explícita de otra capacidad de carta.

**Véase también**: capacidad disparada.

#### Capacidad de preparación (Setup (Triggered Ability))
"Preparación" es un tipo de capacidad disparada que se resuelve durante la preparación de la partida.

- Las capacidades de preparación son obligatorias.
- Las capacidades de preparación en las cartas de encuentro se resuelven durante el paso "Resolver la preparación del escenario y las capacidades 'Cuando se muestre esta carta'" de la preparación.
- Las capacidades de preparación en las cartas de jugador se resuelven durante el paso "Resolver las capacidades de preparación del jugador" de la preparación.

**Véase también**: capacidad disparada, [Apéndice II: Preparación](02-10-APPENDIX-II-SETUP.md).

#### "pierde" (Loses)
Si una carta pierde una característica (como un rasgo, palabra clave o texto de capacidad), la carta funciona como si no poseyera la característica ganada.

- Las características perdidas se siguen considerando impresas en la carta.
- Una característica perdida no puede recuperarse mientras el efecto que causa su pérdida esté en vigor, incluso si un nuevo efecto hiciera que la característica se ganara.

**Véase también**: palabras clave, impreso, rasgos.

#### jugar, poner en juego (Play, Put into Play)
Jugar una carta implica pagar el coste de la carta y colocarla en la zona de juego. Esto hace que la carta entre en juego (o, en el caso de una carta de evento, que resuelva su capacidad y se coloque en la pila de descartes). Las cartas se juegan desde la mano de un jugador.

Algunas capacidades hacen que las cartas se pongan en juego. Esto evita la necesidad de pagar el coste de la carta, así como cualquier restricción o prohibición respecto a jugar esa carta. Una carta que se pone en juego entra en juego en la zona de juego de su controlador.

- Las cartas con el texto "solo en identidad de [tipo]" solo pueden ser jugadas o puestas en juego por un jugador cuyo superhéroe esté en la identidad (form) especificada.
- Cuando se juega una carta de evento, colócala en la mesa, resuelve su capacidad y coloca la carta en la pila de descartes de su propietario.
- Una carta que se pone en juego no se considera que haya sido jugada.
- Cuando una carta se pone en juego, se ignora su coste de recursos.
- A menos que el efecto de "poner en juego" indique lo contrario, las cartas que se ponen en juego deben hacerlo en una zona de juego o estado que coincida con las reglas de juego de la carta.

**Véase también**: entrar en juego, en juego y fuera de juego, iniciación de capacidades, abandona el juego, restricciones y permisos de juego.

#### restricciones y permisos de juego (Play Restrictions and Permissions)
Muchas cartas y capacidades contienen instrucciones específicas sobre cuándo o cómo pueden o no pueden usarse, o sobre condiciones específicas que deben ser verdaderas para poder usarlas.

- Para usar una capacidad o jugar una carta, deben respetarse todas sus restricciones de juego.
- Un permiso es una restricción de juego opcional, que permite a un jugador jugar una carta o usar una capacidad fuera del tiempo o las especificaciones proporcionadas por las reglas del juego. Por ejemplo, un permiso podría permitir que una carta de aliado se juegue desde la pila de descartes de un jugador.

**Véase también**: capacidad, jugar, jugador.

#### capacidad referencial (Referential Ability)
Algunas capacidades se refieren a cartas específicas por su nombre. Estas se denominan capacidades referenciales. Si una capacidad se refiere a un título compartido por múltiples cartas en el juego, esa capacidad se refiere únicamente a la(s) carta(s) que cumplan con los criterios más altos en esta lista:

1. La carta en la que está impresa la capacidad referencial.
    - Tal capacidad es una capacidad autorreferencial.
    - Por ejemplo, la capacidad del aliado básico Spider-Man dice: "Respuesta: Después de que Spider-Man ataque o intervenga, elige a otro personaje Guerrero de la Telaraña → prepara a ese personaje". Esta capacidad se refiere a la carta en la que está impresa y no se dispara cuando otra carta llamada "Spider-Man" ataca o interviene.
2. Cartas asociadas con el mismo superhéroe, incluyendo:
    - La carta de superhéroe.
    - Cartas específicas de superhéroe.
    - Las cartas de obligación del superhéroe.
    - El conjunto de archienemigo del superhéroe.
    - Cartas pertenecientes a un mazo secundario utilizado por el superhéroe.
3. Cartas de jugador (si la capacidad está en una carta de jugador) o cartas de encuentro (si la capacidad está en una carta de encuentro).

**Véase también**: capacidad, personaje, clasificaciones, superhéroe, carta específica de superhéroe.

#### localizar (Find)
Cuando se le instruye a localizar una carta, un jugador busca en cada área de juego donde se podría encontrar esa carta (área de juego, área de cartas apartadas, mazo de jugador, pila de descartes, mazo de encuentros, etc.).

- Los jugadores no deben buscar innecesariamente áreas de juego si saben dónde se puede encontrar la carta que están localizando.
- Todas las áreas de juego están sujetas a localización cuando se resuelve una instrucción de "localizar", con las siguientes excepciones:
    - Cartas de encuentro boca abajo en cualquier área de juego en juego (ya sea que la carta esté en juego en sí misma). (Por ejemplo, cualquier carta de encuentro repartida a un jugador o entregada a un personaje como una carta de aumento).
    - La zona de victoria.
    - Cartas que han sido retiradas de la partida.
- Si se instruye a un jugador a "localizar y mostrar" un esbirro que ya está en juego, ese jugador se enfrenta a ese esbirro y resuelve cualquier palabra clave y/o capacidad disparada que se resuelva como resultado de que ese esbirro sea mostrado (como la capacidad "**Cuando se muestre esta carta**" de ese esbirro).
    - Ese esbirro conserva todas las cartas vinculadas y fichas que tenga.
    - No se considera que ese esbirro esté entrando en juego.
    - Se considera que ese esbirro se enfrenta a ese jugador a menos que ya estuviera enfrentado a él.

**Véase también**: buscar (Search), retirado de la partida, zona de victoria.

#### zona de victoria (Victory Display)
La zona de victoria es un área de juego fuera de juego compartida por todos los jugadores. Las cartas en la zona de victoria siguen las reglas estándar para las cartas fuera de juego.

**Véase también**: en juego y fuera de juego, jugador, Victoria X.

#### buscar (Search)
Cuando a un jugador se le ordena buscar una carta, se le permite mirar cada una de las cartas en el área buscada. Si el jugador encuentra una carta que satisface los criterios de la búsqueda, añade esa carta al área de juego indicada por las instrucciones del efecto de búsqueda.

- Si un jugador encuentra múltiples cartas que satisfacen los criterios de una búsqueda, el jugador elige entre esas opciones.
- Las cartas que se buscan no se consideran que abandonan el área buscada.
- Si se busca cualquier parte de un mazo, al finalizar ese paso del juego, función del juego o capacidad de carta, baraja todo ese mazo.
- Si se instruye a un jugador a "buscar en [su] colección" una carta, el jugador mira entre todas sus cartas de Marvel Champions fuera de la partida actual la carta especificada.
    - Se convierte en el propietario de esa carta hasta el final de la partida.

**Véase también**: localizar (Find), mazo de encuentros, mazo de jugador, barajar.

#### autorreferencial (Self-referential)
**Véase**: [capacidad referencial](#capacidad-referencial-referential-ability).

#### apartar (Set aside)
Algunos pasos del juego o capacidades de cartas instruyen a los jugadores a apartar cartas específicas. Las cartas apartadas están fuera de juego y no tienen interacción con el juego hasta que son referenciadas por instrucciones dentro del escenario o por una capacidad de carta.

**Véase también**: capacidad, en juego y fuera de juego.

### Tipos de Capacidades

#### Capacidades Constantes
Una capacidad constante es cualquier capacidad que no sea una palabra clave y cuyo texto no contenga un disparador de tiempo en negrita.
- Se activa tan pronto como la carta entra en juego y permanece activa mientras la carta esté en juego.
- Algunas buscan continuamente una condición específica (denotada por palabras como "durante", "si" o "mientras").
- Si hay múltiples instancias de la misma capacidad constante en juego, cada una afecta al juego de forma independiente.

**Véase también**: capacidad.

#### Capacidad disparada (Triggered Ability)
Se indican mediante un disparador de tiempo en negrita seguido de dos puntos y el resto del texto.

- **Acción (Action)**: Es un tipo de capacidad disparada. Los jugadores pueden activar capacidades de acción durante su turno, o a petición durante los turnos de otros jugadores.
    - Los jugadores solo pueden activar capacidades de acción en cartas que controlan o en cartas de encuentro.
    - Los jugadores no pueden activar capacidades de acción en obligaciones en las áreas de juego de otros jugadores.
    - **acción obligada (Forced Action)**: Cada capacidad de "acción obligada" debe resolverse antes de que la fase del jugador pueda terminar.
        - Una capacidad de acción obligada puede activarse en cualquier momento en que una capacidad de acción no obligada podría activarse.
        - Si dicha capacidad tiene un coste que no se puede pagar o requiere uno o más objetivos válidos y no tiene ninguno, la fase puede terminar sin que esa capacidad sea resuelta.

- **Cuando se complete esta etapa (When Completed Abilities)**: Una capacidad "cuando se complete" es un tipo de capacidad disparada, indicada por el disparador de tiempo en negrita "**Cuando se complete esta etapa**". Cuando se completa un plan principal, se resuelven todas las capacidades de "cuando se complete" de la carta.
    - El disparador de tiempo "**Cuando se complete esta etapa**" es equivalente al siguiente disparador: "**Interrupción obligada**: Cuando este plan se complete...".

- **Cuando se derrote esta carta (When Defeated Abilities)**: Una capacidad "cuando se derrote" es un tipo de capacidad disparada, indicada por el disparador de tiempo en negrita "**Cuando se derrote esta carta**".
    - El disparador de tiempo "**Cuando se derrote esta carta**" es equivalente al siguiente disparador: "**Interrupción obligada**: Cuando esta carta sea derrotada...".
    - Cuando una etapa del villano, plan secundario, etapa del plan principal, aliado o esbirro es derrotado, se resuelven todas las capacidades de "cuando se derrote" de la carta.
        - Una carta derrotada abandona el juego después de que se resuelva su capacidad de "cuando se derrote", si tiene alguna.

- **Cuando se muestre esta carta (When Revealed Abilities)**: Una capacidad "cuando se muestre" es un tipo de capacidad disparada, indicada por el disparador de tiempo en negrita "**Cuando se muestre esta carta**". Cuando un jugador muestra una carta del mazo de encuentros, una nueva etapa de plan o una nueva etapa de villano, se resuelven todas las capacidades de "cuando se muestre" de la carta.
    - Si una carta de encuentro con una capacidad de "cuando se muestre" entra en juego durante la preparación, resuelve esa capacidad durante el paso "Resolver la preparación del escenario y las capacidades Al mostrarse".
    - Si una carta de encuentro con una capacidad de "cuando se muestre" se pone en juego sin ser mostrada, la capacidad de "cuando se muestre" no se dispara.
    - Las capacidades de "cuando se muestre" en las cartas de villano y de plan principal no se pueden cancelar.

**Véase también**: capacidad, acción, obligado, interrupción, capacidad de recurso, respuesta, capacidad de preparación, resolución simultánea, especial, condición de activación.

#### Condición de activación (Triggering Condition)
Una condición de activación es un suceso específico que tiene lugar en el juego. En las capacidades de las cartas, la condición de activación es el elemento de la capacidad que hace referencia a dicho suceso, indicando el momento en el que se puede utilizar la capacidad. La descripción de la condición de activación de una capacidad suele seguir a la palabra "cuando" o "después de".

- Cada capacidad de "**Interrupción**" y "**Respuesta**" solo puede activarse una vez por ocurrencia de su condición de activación.
    - Se pueden activar múltiples copias de una carta con una interrupción o respuesta por la misma condición de activación.
- Si un único suceso del juego crea múltiples condiciones de activación (como un único ataque que hace que un personaje sufra daño y sea derrotado al mismo tiempo), esas condiciones de activación se manejan con una única ventana de interrupción y una única ventana de respuesta. Durante cada una de estas ventanas, se pueden utilizar en cualquier orden las capacidades que hagan referencia a cualquiera de las condiciones de activación creadas por el suceso.

**Véase también**: interrupción, respuesta.

#### obligado (Forced)
Obligado es una palabra disparadora en negrita. Si la palabra "**obligado**" precede a una capacidad disparada, la iniciación de la capacidad es obligatoria.

- Las capacidades de "**interrupción obligada**" y "**respuesta obligada**" deben resolverse cuando se cumplan sus condiciones de inicio.
- Las capacidades de "**acción obligada**" pueden activarse en cualquier momento durante la fase del jugador cuando podría activarse una capacidad de acción no obligada, pero deben resolverse antes de que la fase del jugador pueda terminar.
- Si una capacidad obligada requiere uno o más objetivos para resolverse y no tiene objetivos válidos, no se inicia.
    - Cualquier coste que se hubiera pagado para iniciar la capacidad no se paga.
- Para cualquier condición de activación dada, las interrupciones obligadas tienen prioridad e se inician antes que las interrupciones no obligadas, y las respuestas obligadas tienen prioridad e se inician antes que las respuestas no obligadas.
- Si dos o más capacidades obligadas se iniciaran en el mismo momento, el primer jugador determina el orden en el que se inician las capacidades, independientemente de quién controle las cartas que portan esas capacidades.
- Cada capacidad obligada debe resolverse lo más completamente posible antes de que la siguiente capacidad obligada disparada por la misma condición de activación pueda iniciarse.

**Véase también**: capacidad, acción, objetivo.

#### "Gana" (Gains)
Si una carta gana una característica (como un rasgo, palabra clave o texto de capacidad), la carta funciona como si poseyera la característica ganada. Las características ganadas no se consideran impresas en la carta.

**Véase también**: palabras clave, impreso, rasgos.

#### ignorar (Ignore)
Una capacidad que ignora alguna capacidad, icono o coste trata esa capacidad, icono o coste como si no estuviera en vigor o presente mientras esa capacidad se está resolviendo.

- Cuando una carta se juega "ignorando su coste de recursos", no se pagan recursos por esa carta. A efectos de los efectos de las cartas, se considera que esa carta ha sido jugada con cero recursos pagados por su coste.

**Véase también**: capacidad, coste, iconos, requisito (recursos).

- **Capacidades obligadas y de muestra**: Las capacidades "**obligado**", "**Cuando se muestre esta carta**", "**Cuando se derrote esta carta**" y "**Cuando se complete esta etapa**" son disparadas por el juego en su momento adecuado.
- **identidad requerida**: Si el disparador contiene "héroe" o "alter ego", la capacidad solo puede usarse si el jugador está en esa identidad (form).
- **Referencia a otras capacidades**: Si se usan comillas alrededor de un disparador (ej: "Cuando sea mostrada"), el texto se refiere a otras capacidades con ese disparador, no es un disparador en sí mismo.

### Obligatoriedad y Opcionalidad

**Resolución Obligatoria:**
- Capacidades constantes.
- Capacidades de "**Preparación**".
- Capacidades "**Cuando se muestre esta carta**" (When Revealed), "**Cuando se derrote esta carta**" (When Defeated).
- Capacidades de "acción obligada", "interrupción obligada", "respuesta obligada".
- Capacidades de "aumento" y palabras clave (keywords).
- *Nota: Si una de estas usa la palabra "puede" (may), la parte que sigue a "puede" es opcional.*

**Resolución Opcional:**
- **Recurso (Resource)**: Una capacidad de recurso es un tipo de capacidad disparada, indicada por el disparador de tiempo en negrita "**Recurso**".
    - Una capacidad de recurso puede activarse en cualquier momento en que el jugador que controla la capacidad esté generando recursos para pagar un coste.
    - Una capacidad de recurso que genera un recurso solo para un tipo específico de coste no puede activarse al pagar un coste que no sea de ese tipo. (Por ejemplo, una capacidad de recurso que genera un recurso para una carta de aspecto no puede activarse al pagar una carta que no sea de aspecto).
- El controlador de la carta decide si usarlas.
- **Excepciones en cartas de encuentro**: 
    - Solo el jugador que controla una carta con un accesorio que usa "tú" o "tu" puede disparar sus capacidades.
    - Solo el jugador con una obligación en su área de juego puede disparar sus capacidades.

### Prioridad de Tiempos Simultáneos (Simultaneous Timing Priority)
Si varias capacidades tienen la misma condición de activación, se resuelven en el siguiente orden de prioridad:
1. Capacidades constantes, efectos postergados y efectos duraderos.
2. **Interrupciones**:
    a. Capacidades de "interrupción obligada" de cartas de estado.
    b. Capacidades de "interrupción obligada".
    c. Capacidades de "interrupción".
3. Capacidades de "aumento" y "**Cuando se muestre esta carta**".
4. **respuestas**:
    a. Capacidades de "respuesta obligada".
    b. Capacidades de "respuesta".
5. Daño derivado.

### Sistema de Triggers

#### ¿Qué es un Trigger?
Un **trigger** es una condición que activa un efecto especial:

**Triggers Comunes:**
- `"When this card is played"` - Al jugar la carta
- `"Tu superhéroe realiza un ataque"` - Cuando tu superhéroe realiza un ataque
- `"Un enemigo realiza un ataque"` - Cuando un enemigo ataca
- `"This card is defeated"` - Cuando la carta es derrotada
- `"Attached card gets damage"` - Cuando un personaje adjunto sufre daño

#### Resolución (Resolve)
Los efectos, capacidades, cartas de evento y cartas de perfidia se resuelven bajo las siguientes condiciones:

- Un efecto se resuelve cuando se aplica al estado del juego.
- Una capacidad se resuelve cuando se dispara y uno o más de sus efectos se resuelven.
- Una carta de evento se resuelve cuando se juega y una o más de sus capacidades se resuelven.
- Una carta de perfidia se resuelve cuando se muestra y una o más de sus capacidades se resuelven.
- Las capacidades constantes nunca se consideran resueltas. Siempre están activas mientras la carta en la que están esté en juego.
- Los tipos de cartas que no sean eventos y perfidias no se consideran resueltos, aunque las capacidades en esos otros tipos de cartas sí pueden resolverse.
- Si todos los efectos de una capacidad son cancelados, no se considera que esa capacidad se haya resuelto.
- Si todas las capacidades de un evento o perfidia son canceladas, no se considera que esa carta se haya resuelto.

**Véase también**: capacidad, cancelar, evento, perfidia.

#### Efecto de Alteración (Alteration Effect)
Un efecto de alteración modifica la resolución de una capacidad que lo precede. Los tipos de efectos de alteración incluyen:

- **Adicional (Additional)**: La palabra "adicional" denota un modificador a una capacidad o estado del juego. El modificador adicional se resuelve simultáneamente con cualquier capacidad que esté modificando y bajo las mismas condiciones que esa capacidad; no crea por sí solo una instancia separada del efecto modificado. (Por ejemplo, *Explosión de Repulsores* dice: "Acción de Héroe (ataque): Inflige 1 de daño a un enemigo y descarta las 5 cartas superiores de tu mazo. Por cada recurso [Energy] impreso descartado de esta manera, inflige 2 de daño **adicional** a ese enemigo").

- **Ya (Already)**: La palabra "ya" denota la resolución de una capacidad alternativa si se cumple una condición específica. El efecto "ya" comprueba si esta condición se cumple antes de que la capacidad precedente intente resolverse. Si es así, el efecto "ya" se resuelve en vez de eso. (Por ejemplo, *Soy Duro* dice: "**Cuando se muestre esta carta**: Dale a Rhino una carta de estado duro. Si Rhino **ya** tiene una carta de estado duro, esta carta gana oleada").

- **Cada vez (Each Time)**: La frase "cada vez" denota una interrupción temporal a una capacidad en resolución. Cuando se cumple una condición especificada por el efecto "cada vez", la resolución de la capacidad precedente se detiene, el efecto "cada vez" se resuelve en su totalidad y luego la capacidad precedente continúa resolviéndose. (Por ejemplo, *¿Te atreves a oponerte a mí?* dice: "**Cuando se muestre esta carta**: Descarta las 5 cartas superiores del mazo de encuentros. **Cada vez** que una carta perteneciente al conjunto Fanático Kree sea descartada de esta manera, asígnate esa carta a ti mismo como una carta de encuentro boca abajo").

- **Esta/Esa Activación/Ataque/Intervención (This/That Activation/Attack/Thwart)**: Los efectos que se refieren a "**este/a**" o "**ese/a**" activación, ataque o intervención denotan un modificador a esa activación, ataque o intervención. (Ejemplos: "Ese ataque gana Brutalidad". "Dale al villano una carta de aumento adicional para esta activación").

- **Ese/a (That)**: Indica un objetivo específico previamente identificado en el texto de la capacidad. (Véase: [objetivo](02-05-ACTIVATION-COMBAT.md#objetivo-target)).
- **Este/a (This)**: Se refiere al elemento de juego que posee la capacidad o al suceso que la dispara.

  - Si "esta/esa activación/ataque/intervención" es parte de una condición para un efecto, no convierte ese efecto en un efecto de alteración. (Por ejemplo, lo siguiente no es un efecto de alteración: "Si este ataque derrota a ese enemigo, cura 2 de daño de tu héroe").

**Véase también**: capacidad, activación, modificadores, efecto de reemplazo, objetivo.
