# Activación y Combate

## Sistema de Activaciones

### ACTIVATION (Activación)
Existen dos tipos de activaciones de enemigo: una activación de **ataque** y una **ejecución del plan**. Siempre que un enemigo ataca o ejecuta el plan, se considera que se ha activado.

#### PLA (SCH)
**Véase**: [atributo básico](02-01-FUNDAMENTALS.md#atributos-básicos-basic-power), [ejecutar el plan (activación de enemigo)](#ejecutar-el-plan-activación-de-enemigo-scheme-enemy-activation).

- Durante el paso dos de la fase del villano, el villano se activa una vez por jugador, en orden de jugador. Si el superhéroe del jugador que resuelve la activación está en identidad de héroe, el villano inicia un ataque contra el superhéroe de ese jugador. Si el superhéroe del jugador está en identidad de alter ego, el villano inicia una ejecución del plan.
- Durante el paso dos de la fase del villano, cada esbirro enfrentado con un jugador se activa contra ese jugador. Si el superhéroe del jugador enfrentado está en identidad de héroe, el esbirro inicia un ataque contra el superhéroe de ese jugador. Si el superhéroe del jugador está en identidad de alter ego, el esbirro inicia una ejecución del plan.
- Cada vez que el villano se activa, dale al villano una carta de aumento del mazo de encuentros para esa activación.
- Algunas capacidades de cartas también pueden hacer que los enemigos ataquen o ejecuten el plan. Estas también se consideran activaciones.

**Orden de Resolución**:
Si múltiples enemigos se activan contra ti simultáneamente, resuelve primero la activación del villano (si la hay) en el orden que elijas, seguida de las activaciones de los esbirros en el orden que elijas.

**Reglas de Resolución de Activaciones**:
- Si un esbirro que se está activando abandona el juego, la activación de ese esbirro termina inmediatamente y no se resuelven más pasos de esa activación.
- Un efecto que inicia una activación de enemigo se considera resuelto después de que dicha activación se haya resuelto por completo.
- Si un efecto inicia una activación durante la resolución de otra activación, la nueva activación se resuelve después de que la activación actual haya terminado de resolverse.
    - Si se inician múltiples activaciones de esta manera, el primer jugador decide el orden en que se resuelven.
    - Todas las capacidades disparadas por la activación inicial se resuelven antes de que se inicien las activaciones subsiguientes.

### ejecutar el plan (activación de enemigo) (Scheme - Enemy Activation)
Una ejecución del plan es un tipo de activación de enemigo. Si se instruye a un enemigo a ejecutar el plan, sigue estos pasos:

1. Si un villano, o un esbirro con la palabra clave **infame**, está ejecutando el plan, dale una carta de aumento boca abajo del mazo de encuentros. (Si un esbirro sin la palabra clave infame está ejecutando el plan, salta este paso).
2. Resuelve cada una de las cartas de aumento del enemigo que ejecuta el plan, una a la vez y en el orden en que fueron repartidas, haciendo lo siguiente:
    a. Da la vuelta a la carta de aumento para mostrarla.
    b. Resuelve cualquier capacidad de "**Aumento**", indicada por el icono de estrella en el área de aumento. (Se ignoran todas las demás capacidades de la carta de aumento).
    c. Aumenta el valor de **PLA** del enemigo que ejecuta el plan en uno por cada icono de aumento en la carta.
    d. Descarta la carta de aumento.
    e. Si al enemigo le queda alguna carta de aumento, repite estos pasos con la siguiente carta de aumento.
3. Coloca amenaza en el plan principal igual al valor modificado de **PLA** del enemigo que ejecuta el plan.

**Véase también**: activación, aumento, esbirro, modificadores, villano, fase del villano, infame.

### enfrentar (Engage)
Cuando un esbirro entra en juego en el área de juego de un jugador, se enfrenta a ese jugador.
A menos que el esbirro o el efecto que puso al esbirro en juego especifiquen lo contrario, el esbirro se enfrenta al jugador que está resolviendo la carta de encuentro actual.

- Un esbirro enfrentado permanece enfrentado al mismo jugador hasta que sea derrotado, retirado del juego o la capacidad de una carta haga que se enfrente a otro jugador.
- Si la capacidad de una carta indica a un jugador que se enfrente a un esbirro, se considera que ese esbirro también se ha enfrentado a ese jugador.
- Mientras un esbirro esté enfrentado a un jugador, las capacidades de las cartas no pueden hacer que el esbirro se enfrente al mismo jugador de nuevo (ya que los dos ya están enfrentados).

**Véase también**: capacidad, derrota, esbirro, jugador, área de juego del jugador.

**Véase también**: aumento, ataque (activación de enemigo), ejecución del plan (activación de enemigo), esbirro, villano, fase del villano.

### Ataques contra aliados (Attacks Against Allies)
Algunos efectos hacen que un villano o esbirro ataque directamente a un aliado. Cuando esto ocurre, cualquier daño no defendido de ese ataque se coloca en el aliado que fue atacado.

- El jugador que controla al aliado se considera el jugador atacado.
    - Las capacidades que se resuelven mientras/cuando/después de que el enemigo atacante "te ataque" se resuelven contra el jugador atacado.
    - Cualquier capacidad de aumento que se refiera a "ti" se refiere al jugador que controla al aliado atacado.
- Los jugadores pueden defender estos ataques de forma normal declarando a un héroe o a un aliado como defensor.
- Si el ataque tiene brutalidad y derrota a un aliado (ya sea el aliado atacado o un aliado defensor), cualquier daño sobrante de ese ataque se inflige al superhéroe del jugador que controlaba al aliado derrotado.

**Véase también**: aliado, ataque (activación de enemigo), defender, objetivo.

### evitar (Prevent)
Algunas capacidades de cartas evitan el daño o la amenaza.

- Cuando se evita el daño, reduce la cantidad de daño que sufre el objetivo (es decir, la cantidad de daño que se coloca sobre el objetivo).
    - Cuando un efecto evita el daño infligido a un personaje, la cantidad de daño que ese personaje "sufre" se reduce, pero la cantidad de daño "infligido" no se reduce.
    - Si un efecto evita todo el daño infligido a un personaje, no se considera que ese personaje haya sufrido daño.
    - Si se evita todo el daño de un ataque, se considera que el personaje atacante ha infligido daño, pero no se considera que haya "atacado y dañado" al personaje atacado.
    - Si infligir daño es un coste, ese coste se considera pagado aunque parte o todo ese daño sea evitado.
    - Si sufrir daño es un coste, ese coste no se considera pagado a menos que se haya sufrido todo ese daño. (Si se evita parte del daño, el coste no ha sido pagado).
- Cuando se evita la amenaza, reduce la cantidad de amenaza que se está asignando antes de que se coloque en el plan.

**Véase también**: capacidad, coste, daño, plan (tipo de carta), objetivo, amenaza.
### daño sufrido (Sustained Damage)
El daño sufrido se refiere a la diferencia entre los puntos de vida máximos de un personaje y sus puntos de vida restantes.

- Para calcular el daño sufrido por un superhéroe o un villano (usando un dial de puntos de vida), comienza con los puntos de vida máximos del personaje (según su valor impreso modificado por cualquier capacidad de carta o efecto de juego) y resta sus puntos de vida restantes (según lo indicado en el dial).
- El daño sufrido por un aliado o esbirro es igual al valor total de todas las fichas de daño sobre la carta.

**Véase también**: aliado, daño, puntos de vida, superhéroe, puntos de vida máximos, puntos de vida restantes, villano.

### daño indirecto (Indirect Damage)
Algunas capacidades de cartas pueden infligir "daño indirecto".

- El daño indirecto infligido a un jugador puede dividirse como ese jugador elija entre los personajes bajo su control.
- El daño indirecto infligido a un grupo de jugadores (o entre jugadores) puede dividirse como el grupo elija entre los personajes amigos en juego.
- Todo el daño indirecto de una única fuente se asigna primero y luego se resuelve simultáneamente.
    - Al asignar daño indirecto, a un personaje no se le puede asignar más daño indirecto del que causaría que fuera derrotado. Esto se evalúa sin tener en cuenta las interacciones con otras capacidades.
    - Un personaje con una carta de estado duro puede tener asignado daño indirecto hasta sus puntos de vida restantes, y todo el daño asignado a él es evitado por su carta de estado duro.
- Los personajes que no pueden sufrir daño no pueden tener asignado daño indirecto.
    - Si el daño indirecto infligido a un jugador no puede asignarse a ningún personaje que ese jugador controle, ese daño se ignora.
- Si el ataque de un enemigo inflige daño indirecto, el daño indirecto se inflige durante el paso cuatro de la activación del enemigo (después de que los jugadores tengan la oportunidad de defenderse del ataque).
    - Solo el personaje defensor, o el superhéroe del jugador atacado si el ataque no fue defendido, se considera que ha sido atacado, incluso si a otros personajes se les asignó parte o la totalidad del daño indirecto.
- Por ejemplo, si sufres 5 de daño indirecto, pero controlas a un aliado con 4 puntos de vida restantes, puedes asignar 4 de ese daño indirecto al aliado, y luego asignar el 1 de daño indirecto restante a tu superhéroe.

**Véase también**: aliado, ataque (activación de enemigo), daño, derrota, jugador.

### objetivo (Target)
Si una función del juego o una capacidad de carta se dirige hacia un elemento del juego (como un ataque que inflige daño a un enemigo), ese elemento del juego se convierte en el **objetivo** de esa función o capacidad durante la resolución de la misma.

- Los ejemplos de objetivos incluyen, pero no se limitan a: "el villano", "un esbirro", "un enemigo", "un plan", "un superhéroe", "un aliado", "un personaje", "un jugador", "tú", "una carta".
- Si una capacidad o función del juego requiere uno o más objetivos, esa capacidad o función solo puede iniciarse si tiene al menos un objetivo válido. Por ejemplo, una capacidad que dice "inflige 5 de daño a un esbirro" no puede iniciarse si no hay esbirros en juego.
    - Los atributos básicos son funciones del juego que requieren un objetivo válido.
    - La frase "elige un [elemento del juego]" indica que se deben seleccionar uno o más objetivos para que una capacidad se inicie.
    - Las capacidades que hacen que un jugador robe una o más cartas siempre tienen un objetivo válido siempre que ese jugador tenga al menos una carta en su mazo.
- Un objetivo es válido para una capacidad o función del juego si alguna parte de esa capacidad puede afectar a ese objetivo.
    - Los ejemplos de efectos sobre un objetivo incluyen, pero no se limitan a: infligir/curar daño, añadir/quitar amenaza, dar/quitar una carta de estado, agotar/preparar al objetivo, derrotar/descartar al objetivo.
    - **Excepción**: Un personaje con un ATQ, PLA o INT de 0 puede realizar una activación o atributo básico usando ese valor contra un objetivo que de otro modo sea válido para esa activación o atributo básico. (Por ejemplo, un héroe con una INT de 0 puede realizar una intervención básica contra un plan con amenaza).
    - El coste de una capacidad o función del juego no se tiene en cuenta al determinar si esa capacidad o función puede afectar a un objetivo.
    - Si una capacidad o función del juego tiene múltiples efectos sobre su objetivo, el objetivo es válido si al menos uno de esos efectos puede afectarlo.
    - Un objetivo no es válido para una capacidad si esa capacidad causara que el objetivo realice una función del juego que otra capacidad dice que el objetivo no puede realizar. Por ejemplo, un personaje con un accesorio que dice "el personaje vinculado no puede prepararse" no es un objetivo válido para una carta que prepara a un personaje.
    - El daño que se inflige pero no se sufre (por ejemplo, si se evita el daño) se considera que afecta a un objetivo.
    - Un objetivo que "no puede sufrir daño" no es un objetivo válido para una capacidad o función del juego cuyo único efecto sobre ese objetivo es infligirle daño.
    - Un objetivo que no puede ser atacado no es un objetivo válido para una capacidad etiquetada como ataque.
    - Un objetivo que no puede ser intervenido no es un objetivo válido para una capacidad etiquetada como intervención.
- Una capacidad o función del juego que tiene como objetivo múltiples elementos del juego de un tipo específico (por ejemplo, "cada enemigo") puede iniciarse siempre que al menos uno de esos elementos del juego sea un objetivo válido.
    - Esa capacidad o función del juego no se resuelve contra ninguno de esos elementos del juego que no sea un objetivo válido.
    - Por ejemplo, el icono de crisis () evita que se quite amenaza del plan principal. Una capacidad que dice "quita 1 de amenaza de cada plan" puede usarse mientras hay un icono de crisis en juego si hay al menos 1 plan del cual se pueda quitar amenaza. En este caso, no se quitaría amenaza del plan principal.
- Una capacidad que hace referencia a un objetivo futuro (es decir, "la próxima carta que juegues") no requiere un objetivo para iniciarse.
- Una capacidad con un efecto de localización (Find) o búsqueda (Search) solo requiere un área de juego localizable o buscable para iniciarse.

**Véase también**: capacidad, elegir (elemento de juego), coste, elemento del juego, capacidad etiquetada.

### derrota del villano (Villain Defeat)
Si el dial de puntos de vida del villano se reduce a cero, los jugadores han derrotado esa etapa del villano.
Retira la etapa actual del mazo de villano de la partida. Se muestra la siguiente etapa secuencial del mazo de villano. Ajusta el dial de puntos de vida del villano según lo indicado en esa etapa.
Si la etapa final del mazo de villano es derrotada, los jugadores ganan la partida.

- La muestra de un villano no puede ser cancelada.
- El daño sobrante que se inflige para derrotar una etapa del villano no se transfiere a la nueva etapa.
- Si la nueva etapa del villano tiene el mismo título que la etapa anterior:
    - La nueva etapa del villano se considera el mismo personaje que la etapa derrotada a efectos de las capacidades de las cartas (como la palabra clave represalia X).
    - Los accesorios, mejoras, cartas de estado, contadores y fichas que no sean de daño en un villano se transfieren a la nueva etapa.
    - Si el villano fue derrotado mientras se activaba, el villano reanuda esa activación utilizando la nueva etapa del villano.
- Si la nueva etapa del villano tiene un título diferente al de la etapa anterior:
    - La nueva etapa del villano no se considera el mismo personaje que la etapa derrotada a efectos de las capacidades de las cartas.
    - Los accesorios, mejoras, cartas de estado, contadores y fichas que no sean de daño no se transfieren a la nueva etapa.
    - Si el villano fue derrotado mientras se activaba, la activación termina sin resolverse.

**Véase también**: contador de cualquier tipo, accesorio, daño, derrota, daño sobrante, puntos de vida, cartas de estado, villano.

## Combate

### Ataque (tipo de capacidad del jugador)
Algunos efectos de juego y capacidades de cartas hacen referencia a un ataque. Hay varias formas diferentes en las que puede ocurrir un ataque:

- Un héroe o aliado puede usar su atributo básico de ataque para atacar a un enemigo. Un personaje debe agotarse para usar este atributo básico. Esto inflige daño al enemigo igual al valor de ATQ del personaje.
    - Un personaje solo puede iniciar un ataque básico si hay un enemigo que pueda ser atacado por ese personaje o si ese personaje está aturdido.
    - Una capacidad que permite a un héroe o aliado "realizar un ataque básico sin agotarse" puede permitir que un personaje agotado realice un ataque básico.
- Si una capacidad disparada está etiquetada como un ataque —como "Acción de Héroe (ataque)"— la resolución de esa capacidad se considera atacar al objetivo especificado. A menos que el texto de la capacidad especifique lo contrario, un héroe no se agota al usar tal capacidad.
    - Una capacidad etiquetada como un ataque se considera un único ataque, incluso si ese ataque inflige múltiples instancias de daño.
    - Cuando una capacidad de ataque ve su daño aumentado por otra capacidad, cada instancia de daño en esa capacidad de ataque que no use la palabra "adicional" se incrementa en la cantidad especificada.
- Si una capacidad dice "Realiza los siguientes X ataques en orden", seguido de dos o más instancias de daño, cada una de esas instancias se considera un ataque independiente.
    - Una capacidad que aumenta el daño de un ataque solo aumenta el daño de uno de los ataques de esa capacidad, aunque dicha capacidad puede dispararse por separado para cada ataque.
- Los ataques de héroes y aliados pueden tener como objetivo a cualquier enemigo, a menos que la capacidad de una carta (como guardia) impida que ese enemigo sea atacado.
- Cuando un ataque tiene como objetivo a múltiples enemigos, se considera que el personaje atacante ha atacado a cada uno de esos enemigos.
    - Cada enemigo atacado con la palabra clave represalia X que siga en juego después de que el ataque se resuelva inflige su daño de represalia al personaje atacante.

El orden de resolución para las capacidades disparadas por la resolución de un ataque es el siguiente:
1. Capacidades obligadas (como la palabra clave represalia) con los siguientes disparadores (en cualquier orden):
    - "después de que [personaje] ataque [y dañe/derrote] a [un enemigo/esbirro]..."
    - "después de que [personaje] sea atacado..."
2. Capacidades no obligadas con los disparadores enumerados anteriormente.
3. Daño derivado (para aliados).

**Véase también**: aliado, atributo básico, daño, defender, enemigo, superhéroe, capacidad etiquetada, esbirro, modificadores, represalia X, objetivo, villano.

### Ataque (activación de enemigo)
Un ataque es un tipo de activación de enemigo. Cuando un enemigo inicia un ataque, selecciona como objetivo a un jugador específico y luego resuelve ese ataque contra ese jugador.

- Los ataques de los enemigos siempre se inician contra un jugador y un personaje.
    - Normalmente, el personaje atacado es el héroe del jugador, pero las capacidades pueden hacer que un enemigo ataque a la identidad de alter ego de un jugador o a un aliado que ese jugador controle. En todos estos casos, se sigue considerando que el jugador ha sido atacado.
    - Si un personaje distinto del personaje atacado defiende el ataque, ese personaje se convierte en el nuevo objetivo de ese ataque.
    - Si un jugador distinto del jugador atacado defiende el ataque con un personaje que controla, ese jugador se convierte en el nuevo objetivo de ese ataque.
    - Las capacidades que se disparan "Cuando/Después de que [enemigo] te ataque" se resuelven cuando/después de que un jugador es atacado, independientemente de qué personaje controlaba que fue atacado.

Para resolver un ataque de enemigo, sigue estos pasos:
1. **Dar carta de aumento**: Si el villano, o un esbirro con la palabra clave infame, está atacando, dale una carta de aumento boca abajo del mazo de encuentros. (Si un esbirro sin la palabra clave infame está atacando, salta este paso).
2. **Declarar defensor**: Si un jugador desea defender, ese jugador agota a un héroe o aliado como defensor.
    - El personaje defensor se convierte en el personaje objetivo del ataque.
    - Si un jugador distinto del jugador objetivo defiende, el jugador defensor se convierte en el jugador objetivo del ataque.
3. **Mostrar cartas de aumento**: Da la vuelta y resuelve cada una de las cartas de aumento del enemigo atacante, una a una y en el orden en que fueron repartidas, haciendo lo siguiente:
    a. Da la vuelta a la carta de aumento boca arriba.
    b. Resuelve cualquier capacidad de "aumento", indicada por el icono de estrella en el área de aumento. (Se ignoran todas las demás capacidades de la carta de aumento).
    c. Aumenta el valor de ATQ del enemigo atacante en uno por cada icono de aumento en la carta.
    d. Descarta la carta de aumento.
    e. Si al enemigo le queda alguna carta de aumento, repite estos pasos con la siguiente carta de aumento.
4. **Calcular el daño**: Determina cuánto daño se infligirá por el ataque.
    - El daño base es igual al ATQ del enemigo atacante, incluyendo los modificadores de las capacidades en juego y los iconos de aumento resueltos para el ataque.
    - Si se ha declarado a un héroe como defensor del ataque, reduce la cantidad de daño infligido por el valor de DEF de ese héroe.
5. **Infligir el daño**: Inflige la cantidad de daño calculada en el paso anterior, basándose en lo siguiente:
    - Si se declaró a un héroe como defensor del ataque, el daño del ataque se inflige a ese héroe.
        - Se considera que el héroe defensor ha sido atacado.
        - Si un héroe con estado duro realiza una defensa básica, el daño se reduce primero por el valor de DEF de ese héroe. Si el daño se reduce a 0, el héroe conserva su estado duro.
    - Si se declaró a un aliado como defensor del ataque, todo el daño del ataque se inflige al aliado. (Si el aliado es derrotado por el ataque, el daño adicional no se transfiere al superhéroe).
        - Se considera que el aliado defensor ha sido atacado.
        - Si el aliado defensor abandona el juego antes de que se inflija el daño del ataque, se considera que el ataque no tiene ningún personaje defendiendo y la identidad del controlador de ese aliado se convierte en el objetivo del ataque.
    - Si no se declaró ningún personaje como defensor del ataque, el ataque se considera **no defendido**. Todo el daño del ataque se inflige al personaje que es el objetivo del ataque.
        - Se considera que el personaje objetivo ha sido atacado.
6. El ataque termina de resolverse y los siguientes tipos de capacidades se disparan en orden:
    a. Capacidades obligadas (como la palabra clave represalia) con los siguientes disparadores (en cualquier orden):
        - "después de que [personaje] ataque [y dañe/derrote] a [ti/un aliado]..."
        - "después de que [personaje] sea atacado..."
        - "después de que [personaje] defienda [y no sufra daño]..."
        - "después de que [personaje] [sufra/infilja] daño..."
    b. Capacidades no obligadas con los disparadores enumerados anteriormente.

**Véase también**: activación, aliado, ataques contra aliados, aumento, daño, defender, enemigo, superhéroe, esbirro, modificadores, represalia X, objetivo, villano, infame.

### Ataques contra aliados
Algunos efectos hacen que un villano o esbirro ataque directamente a un aliado. Cuando esto ocurre, cualquier daño no defendido de ese ataque se coloca sobre el aliado que fue atacado.

- El jugador que controla al aliado se considera el jugador atacado.
    - Las capacidades que se resuelven mientras/cuando/después de que el enemigo atacante "te ataque" se resuelven contra el jugador atacado.
    - Cualquier capacidad de aumento que se refiera a "ti" se refiere al jugador que controla al aliado atacado.
- Los jugadores pueden defender estos ataques de forma normal declarando a un héroe o a un aliado como defensor.
- Si el ataque tiene brutalidad (overkill) y derrota a un aliado (ya sea el aliado atacado o un aliado defensor), cualquier daño sobrante de ese ataque se inflige al superhéroe del jugador que controlaba al aliado derrotado.

**Véase también**: aliado, ataque (activación de enemigo), defender, objetivo.

### Defender (Defend), Defensa (Defense)
Durante un ataque de enemigo, un jugador puede defenderse de ese ataque usando cartas que controle.

- Solo un jugador a la vez puede defenderse de un ataque de enemigo. Mientras un jugador está defendiendo, otros jugadores no pueden defenderse contra ese mismo ataque.
- Un héroe puede usar su atributo básico de defensa para defenderse de un ataque de enemigo. Un héroe debe agotarse para usar este atributo básico. La cantidad de daño infligido por el ataque se reduce por el valor de DEF del héroe, y cualquier daño restante se inflige a ese héroe. Mientras un héroe está defendiendo contra un ataque, otros personajes amigos no pueden defender contra ese ataque.
    - Cuando la capacidad de una carta dice "declarar a [un héroe] como el defensor" de un ataque, se considera que ese héroe está realizando una defensa básica.
    - Una capacidad de carta que permite declarar a un héroe como defensor sin agotarse puede usarse en un héroe agotado.
- Un aliado puede agotarse para defenderse de un ataque de enemigo. El daño del ataque se inflige a ese aliado. Mientras un aliado está defendiendo contra un ataque, otros personajes amigos no pueden defender contra ese ataque.
    - Cuando un aliado defiende un ataque, ese aliado se convierte en el personaje objetivo de ese ataque, y su controlador se convierte en el jugador objetivo de ese ataque.
    - Cuando la capacidad de una carta dice "declarar a [un aliado] como el defensor" de un ataque, ese aliado se convierte en el defensor del ataque.
    - Una capacidad de carta que permite declarar a un aliado como defensor sin agotarse puede usarse en un aliado agotado.
- Cuando un jugador inicia una capacidad disparada etiquetada como defensa —como "Interrupción de Héroe (defensa)"— durante un ataque de enemigo, el superhéroe de ese jugador se convierte en el defensor y se considera que ha defendido el ataque si aún no hay un defensor.
    - El superhéroe del jugador se considera el defensor tan pronto como la capacidad etiquetada como defensa comienza a resolverse.
    - Las capacidades que se disparan "cuando tu héroe defiende contra un ataque" pueden dispararse al resolver una capacidad etiquetada como defensa.
    - Resolver una capacidad etiquetada como defensa no es una defensa básica y no hace que un héroe reduzca la cantidad de daño infligido por el valor de DEF de ese héroe. Ese héroe aún puede ser declarado defensor del ataque durante el paso de "Declarar Defensor" o mediante la capacidad de otra carta.
    - A menos que el texto de la capacidad lo especifique, un héroe no se agota al usar una capacidad etiquetada como defensa.
    - El jugador defensor puede resolver cualquier número de capacidades de defensa durante un ataque de enemigo (siempre que se cumplan las condiciones de activación de esas capacidades).
    - Una vez que un jugador resuelve una capacidad etiquetada como defensa durante un ataque de enemigo, otros jugadores no pueden resolver capacidades etiquetadas como defensa para ese mismo ataque.
    - Las capacidades etiquetadas como defensa pueden ser jugadas durante un ataque por un jugador cuyo aliado esté defendiendo ese ataque. En ese caso, el superhéroe del jugador no se convierte en el defensor.
    - Un jugador puede disparar capacidades etiquetadas como defensa fuera de un ataque si se cumple la condición de activación de la capacidad. Cuando se activa de esta manera, no se considera que el superhéroe del jugador haya defendido un ataque.
- Si un jugador defiende contra un ataque de enemigo que tiene como objetivo a un jugador diferente (ya sea defendiendo con un personaje que controla o resolviendo una capacidad de defensa), el jugador defensor se convierte en el nuevo objetivo de ese ataque.
    - Cualquier capacidad disparada que se refiera a "ti" se refiere al jugador que era el objetivo del ataque cuando esa capacidad se resolvió. (Por ejemplo, el "ti" en una capacidad que se dispara "cuando [enemigo] te ataca" se refiere al jugador contra el cual se inició el ataque, mientras que el "ti" en una capacidad que se dispara "después de que [enemigo] te ataque" se refiere al jugador cuyo personaje defendió el ataque).
    - Cualquier capacidad constante o de aumento que se refiera a "ti" se refiere al jugador defensor.
- Si no se utiliza ningún personaje para defenderse de un ataque de enemigo, ese ataque se considera **no defendido**. Además, si un aliado defensor es derrotado antes de que se inflija el daño del ataque (como a través de una capacidad de "aumento"), el ataque se considera **no defendido**.
- Las capacidades que se disparan después de que un personaje defienda un ataque se resuelven después de que termine ese ataque.
    - Si un efecto hace que un ataque defendido termine antes de resolverse por completo, se sigue considerando que el ataque ha sido defendido.
    - Las capacidades que se disparan después de que un personaje use un atributo básico se disparan después de que se resuelva un ataque en el cual un personaje realizó una defensa básica.

**Véase también**: aliado, ataque (activación de enemigo), capacidad, daño, "amigo", superhéroe, capacidad etiquetada, jugador.

### Intervención (INT)
Algunos efectos de juego y capacidades de cartas hacen referencia a un intento de intervención. Hay varias formas diferentes en las que esto puede ocurrir:

- Un héroe o aliado puede usar su atributo básico de intervención para intervenir en un plan. Un personaje debe agotarse para usar este atributo básico. Esto quita amenaza igual al valor de **INT** del personaje del plan.
    - Un personaje solo puede iniciar una intervención básica si hay un plan con al menos una amenaza para que el personaje la quite o si ese personaje está confundido.
    - Una capacidad que permite a un héroe o aliado "realizar una intervención básica sin agotarse" puede permitir que un personaje agotado realice un intento de intervención.
- Si una capacidad disparada está etiquetada como una intervención —como "Acción de Héroe (intervención)"— la resolución de esa capacidad se considera intervenir en el plan especificado. A menos que el texto de la capacidad especifique lo contrario, un héroe no se agota al usar tal capacidad.
    - Una capacidad etiquetada como una intervención se considera una única intervención, incluso si esa intervención quita múltiples instancias de amenaza.
    - Si una capacidad aumenta la cantidad de amenaza que una capacidad etiquetada como intervención quita y esa capacidad quita múltiples instancias de amenaza, cada una de esas instancias que no use la palabra "adicional" se incrementa en la cantidad especificada.

**Véase también**: aliado, atributo básico, daño derivado, agotado, capacidad etiquetada, plan principal, modificadores, plan secundario, amenaza.

### daño derivado (Consequential Damage) ()
Después de que un aliado ataca, sufre daño derivado igual al número de iconos de daño derivado () debajo de su campo ATQ.
Después de que un aliado interviene, sufre daño derivado igual al número de iconos de daño derivado () debajo de su campo INT.

- El daño derivado se inflige a un aliado después de resolver las capacidades que se disparan por el ataque o la intervención del aliado.
- Si el objetivo del atributo básico de un aliado abandona el juego antes de que ese aliado inflija daño igual a su ATQ o elimine amenaza igual a su INT, el aliado no sufre daño derivado (pero aun así se agota).
    - Ese aliado no se considera que haya atacado o intervenido para el propósito de otras capacidades.
    - Por ejemplo, la capacidad de Puño de Hierro dice: "Interrupción: Cuando Puño de Hierro ataca a un enemigo, quita 1 contador místico de él → aturde a ese enemigo e inflígele 1 de daño". Si este efecto derrota al enemigo al que Puño de Hierro estaba atacando, el ataque básico se aborta tan pronto como el objetivo abandona el juego, por lo que Puño de Hierro no sufre daño derivado por ello.

**Véase también**: aliado, ataque (tipo de capacidad del jugador), atributo básico, daño, iconos, intervención.

### cartas de aumento (Boost Cards)
Cada vez que el villano ataca o ejecuta el plan, se le entrega una carta boca abajo del mazo de encuentros como carta de aumento. Los esbirros con la palabra clave infame también reciben una carta de aumento cuando se activan.

Durante la activación (y después de que se declaren los defensores si el villano está atacando), cada carta de aumento en el enemigo se muestra una a una. Añade el número de iconos de aumento de cada carta al valor de ATQ del enemigo (si está atacando) o al valor de PLA (si está ejecutando el plan) para esa activación.

Los iconos de aumento () se encuentran en la parte inferior derecha de la carta.

Si el campo de aumento tiene un icono de estrella, indica que la carta tiene una capacidad de "aumento". Consulta el cuadro de texto de la carta y resuelve la capacidad de "aumento" cuando la carta se muestre boca arriba. La capacidad de "aumento" se encuentra debajo de la línea divisoria en el cuadro de texto.

- Un icono de estrella no se considera en sí mismo un icono de aumento y no contribuye al valor de ATQ o PLA del villano.
- Solo el texto de capacidad debajo de la línea divisoria está activo en una carta que se está resolviendo como una carta de aumento.
- El daño infligido por una capacidad de aumento no se considera daño infligido por la activación durante la cual se resolvió la capacidad de aumento.
- Si se resuelven cartas de aumento adicionales para una activación, los iconos de aumento son acumulativos y se resuelven todas las capacidades de "aumento" de esas cartas.
- Después de aplicar una carta de aumento a una activación, descártala.
- Si un enemigo recibe una carta de aumento fuera de su propia activación, esa carta de aumento permanece boca abajo sobre ese enemigo hasta que se active.
    - Si ese enemigo es un villano o un esbirro con la palabra clave infame, se le sigue entregando otra carta de aumento al inicio de su activación como de costumbre.

**Véase también**: ataque (activación de enemigo), ejecución del plan (activación de enemigo), icono de estrella, infame.

### curar (Heal)
Si una capacidad cura a un personaje, el daño acumulado que el personaje ha sostenido puede ser quitado del personaje.

- Un efecto de curación solo puede llevar a un personaje hasta sus puntos de vida máximos, a menos que el efecto indique explícitamente que puede llevar al personaje por encima de su máximo.
- Los efectos que mueven el daño fuera de un personaje se consideran curar a ese personaje.

**Véase también**: aliado, puntos de vida, superhéroe, esbirro, villano.

## Daño

### brutalidad (Overkill)
El daño sobrante de los ataques con brutalidad se inflige al superhéroe o al villano.

- Si un ataque con brutalidad derrota a un aliado o esbirro, cualquier daño sobrante de ese ataque se inflige al superhéroe o al villano, respectivamente.
- Si el daño sobrante es evitado, no se inflige al superhéroe/villano.

**Véase también**: [daño sobrante](#daño-sobrante-excess-damage), ataque, daño, puntos de vida, superhéroe, esbirro, villano.

### daño sobrante (Excess Damage)
El daño sobrante es cualquier cantidad de daño que se inflige a un personaje más allá de los puntos de vida restantes de ese personaje.

**Véase también**: aliado, daño, puntos de vida, superhéroe, esbirro, puntos de vida restantes, villano.

- El daño en un superhéroe o villano se sigue mediante un dial de puntos de vida. Si dicho personaje sufre daño, reduce su dial en la cantidad de daño que sufrió.
- El daño en un aliado o esbirro se sigue mediante fichas de daño. Si dicho personaje sufre daño, coloca el valor especificado de fichas de daño sobre el personaje.
- Cuando se inflige daño a un personaje, ese personaje sufre daño.
    - Cuando se modifica la cantidad de daño que inflige un efecto, la cantidad de daño que sufre el personaje se modifica de manera similar.
    - Cuando se modifica la cantidad de daño que sufre un personaje (como cuando se evita el daño), la cantidad de daño infligido no se modifica.
    - El orden de resolución para los efectos que rodean el infligir y sufrir daño es el siguiente:
        1. Capacidades que se disparan "cuando [personaje] fuera a infligir/sufrir cualquier cantidad de daño..."
        2. Cartas de estado duro.
        3. Capacidades que se disparan "cuando [personaje] fuera a sufrir cualquier cantidad de daño..."
        4. Capacidades que se disparan "cuando [personaje] sufre cualquier cantidad de daño..."
        5. Colocación de daño en el personaje.
        6. Capacidades que se disparan "cuando [personaje] fuera a ser derrotado..."
        7. Capacidades que se disparan "cuando [personaje] es derrotado..." (incluyendo las capacidades "**Cuando se derrote esta carta**").
        8. Descarte de un personaje derrotado.
        9. Capacidades que se disparan "después de que [personaje] inflija/sufra cualquier cantidad de daño..." o "después de que [personaje] derrote/sea derrotado..."

**Véase también**: limitaciones de componentes, derrota, puntos de vida, daño indirecto, mover, evitar, duro.
