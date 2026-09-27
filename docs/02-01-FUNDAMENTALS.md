# Fundamentos del Juego

## Reglas Fundamentales

### Reglas de Oro (The Golden Rules)
- Si el texto de esta Referencia de Reglas contradice directamente el texto del libro Aprender a Jugar, el texto de la Referencia de Reglas tiene precedencia.
- Si el texto de una carta o las reglas de un escenario contradicen directamente el texto de la Referencia de Reglas o del libro Aprender a Jugar, el texto de la carta o las reglas del escenario tienen precedencia.

### La Regla Fatídica (The Grim Rule)
Si los jugadores no pueden encontrar la respuesta a un conflicto de reglas o de tiempos en esta Referencia de Reglas, deben resolver el conflicto de la manera que los jugadores perciban como la peor resolución posible en ese momento con respecto a ganar el escenario, y continuar con el juego.

### Limitaciones de Componentes (Component Limitations)
- No hay límite para el número de fichas de amenaza, fichas de daño, fichas de aceleración, cartas de estado o contadores de cualquier tipo que pueden estar en el juego en un momento dado.
- Si los jugadores se quedan sin las fichas, contadores o cartas de estado proporcionados, se pueden usar otras fichas, contadores o monedas.

#### valor base (Base Value)
Un valor definido antes de que se apliquen los modificadores. En la mayoría de los casos, es también el valor impreso.

**Véase también**: modificadores, impreso.

#### atributo básico (Basic Power)
Un atributo básico es una estadística que permite a un personaje realizar una determinada función del juego.

- Tiene cinco atributos básicos diferentes:
    - **atributo de ataque (ATQ)**: puede ser usado por un personaje para realizar un ataque básico e infligir daño a otro personaje. Generalmente, los héroes, aliados, villanos y esbirros tienen atributo de ataque.
    - **atributo de intervención (INT)**: puede ser usado por un personaje para realizar una intervención básica y quitar amenaza de un plan. Generalmente, los héroes y aliados tienen atributo de intervención.
    - **atributo de defensa (DEF)**: puede ser usado por un personaje para realizar una defensa básica y evitar el daño de un ataque. Generalmente, solo los héroes tienen atributo de defensa.
    - **atributo de recuperación (REC)**: puede ser usado por un personaje para realizar una recuperación básica y curarse daño a sí mismo. Generalmente, solo las identidades de alter ego tienen atributo de recuperación.
    - **atributo de planificación (PLA)**: puede ser usado por un personaje para realizar una ejecución de plan básica y colocar amenaza en el plan principal. Generalmente, los villanos y esbirros tienen atributo de planificación.

**Véase también**: aliado, ataque (activación de enemigo), ataque (tipo de capacidad del jugador), defender, superhéroe, esbirro, modificadores, mostrar, recuperar, recuperación, ejecución del plan (activación de enemigo), intervenir.

#### guion (valor) (Dash (Value))
Un valor presentado como un guion (–) indica que dicho valor no puede ser utilizado.

- Si una carta tiene un guion (–) como su valor de coste, esa carta no puede ser jugada y solo puede entrar en juego a través de otros medios.
- Si el atributo de un personaje (ATQ, DEF, REC, PLA e INT) tiene un guion (–) como valor, el personaje no puede agotarse para usar ese atributo.
- Si un paso del juego o la capacidad de una carta hace referencia a un valor de guion (–), ese valor se trata como un 0 inmodificable. (Por ejemplo, si una capacidad tiene como objetivo al "aliado con el PLA más bajo", un aliado con un guion en su PLA se considera que tiene el mismo PLA que un aliado con un PLA de 0).

**Véase también**: atributo básico, variable no numérica.

#### variable no numérica (Non-numerical Variable)
Si una variable no numérica (como una letra u otro símbolo) se define con un valor numérico (como la capacidad de una carta que asigna un valor a 'X'), trata esa variable como el valor definido. Si la variable no está definida (por ejemplo, si la capacidad que la define ha sido anulada), trata esa variable como igual a 0.

- Para los costes que implican la letra X, el valor de X se define mediante la capacidad de una carta o por elección del jugador, tras lo cual el importe pagado puede ser modificado por efectos sin cambiar el valor de X.

**Véase también**: valor base, guion (valor), impreso, icono de estrella.

#### puntos de vida (Hit Points)
Cada personaje (superhéroe, aliado, esbirro y villano) tiene un valor de puntos de vida. Los puntos de vida representan la durabilidad de ese personaje.

Cuando se inflige daño a un personaje, este reduce los puntos de vida restantes del personaje (la cantidad de daño que ese personaje puede sufrir antes de llegar a cero puntos de vida).

- La frase "**puntos de vida iniciales**" se refiere al valor de puntos de vida impreso de un superhéroe.
- El dial de puntos de vida de un superhéroe o villano representa sus puntos de vida restantes. Si un superhéroe o villano sufre daño, aplica el daño reduciendo su dial de puntos de vida en la cantidad especificada.
    - Si el dial de puntos de vida de un jugador se reduce a cero, ese jugador es derrotado y eliminado de la partida.
    - Si el dial de puntos de vida de un villano se reduce a cero, esa etapa del villano es derrotada.
    - Cuando entra en vigor una capacidad que dice que un superhéroe o villano "**obtiene +X puntos de vida**", aumenta el dial de puntos de vida de ese personaje en X. Si esa capacidad deja de estar en vigor más tarde, reduce el dial de puntos de vida de ese personaje en X.
- Si un aliado o esbirro sufre daño, realiza el seguimiento del daño colocando fichas de daño sobre ese personaje. Las fichas de daño en un aliado o esbirro reduce los puntos de vida restantes de ese personaje en el valor total de las fichas. Un aliado o esbirro con cero o menos puntos de vida restantes es derrotado y colocado en la pila de descartes correspondiente.
    - Si una capacidad que dice que un aliado o esbirro "obtiene +X puntos de vida" deja de estar en vigor y hace que ese aliado o esbirro tenga un daño acumulado igual o superior a sus puntos de vida, ese aliado o esbirro es derrotado.

##### puntos de vida restantes (Remaining Hit Points)
Los puntos de vida restantes de un personaje son la cantidad de daño que ese personaje puede sufrir antes de llegar a cero puntos de vida.

- El dial de puntos de vida de un superhéroe o de un villano representa sus puntos de vida restantes.
- Para calcular los puntos de vida restantes de un aliado o esbirro, se empieza con los puntos de vida máximos del personaje (según indica su valor impreso modificado por cualquier capacidad de carta o efecto del juego) y se le resta el daño acumulado (el número de fichas de daño que haya sobre él).

##### puntos de vida máximos (Maximum Hit Points)
Los puntos de vida máximos de un personaje son sus puntos de vida base más o menos todos los modificadores de puntos de vida "obtiene" que estén activos en ese personaje.

Algunos personajes pueden tener un número infinito de puntos de vida. Un personaje con puntos de vida infinitos no puede ser derrotado por sufrir daño, ya que la cantidad de daño que sufra nunca hará que sus puntos de vida restantes lleguen a cero. Sin embargo, se puede seguir infligiendo daño a un personaje con puntos de vida infinitos mediante ataques y capacidades de cartas.

**Véase también**: aliado, valor base, daño, derrota, curar, superhéroe, esbirro, modificadores, eliminación de jugador, puntos de vida restantes, daño acumulado, villano, derrota del villano.

#### iconos (Icons)
Los iconos son elementos gráficos que representan diversas funciones dentro del juego.

- **icono de energía ()**: genera un recurso de energía cuando se gasta. (Véase: recurso de energía).
- **icono mental ()**: genera un recurso mental cuando se gasta. (Véase: recurso mental).
- **icono físico ()**: genera un recurso físico cuando se gasta. (Véase: recurso físico).
- **icono universal ()**: puede generar un recurso de energía, mental, físico o universal cuando se gasta. (Véase: recurso universal).
- **icono de aceleración ()**: coloca amenaza adicional en el plan principal durante la fase del villano. (Véase: icono de aceleración).
- **icono de amplificación ()**: aumenta en uno el número de iconos de aumento en las cartas de aumento durante las activaciones de los enemigos. (Véase: icono de amplificación).
- **icono de crisis ()**: evita que los jugadores quiten amenaza del plan principal. (Véase: icono de crisis).
- **icono de riesgo ()**: aumenta el número de cartas de encuentro que se reparten a los jugadores durante la fase del villano. Cada icono de riesgo reparte a un jugador una carta adicional (no una carta por jugador). (Véase: icono de riesgo).
- **icono de aumento ()**: aumenta el valor de ATQ o PLA del enemigo durante las activaciones de los enemigos. (Véase: aumento).
- **icono de estrella ()**: se utiliza en conjunto con el campo de atributo o de aumento de una carta para indicar que hay una capacidad obligatoria en el cuadro de texto que corresponde a ese campo. (Véase: icono de estrella).
- **icono de daño derivado ()**: se utiliza en conjunto con el campo ATQ o INT de un aliado. Después de que un aliado ataque o intervenga, sufre un daño derivado por cada icono de daño derivado en ese campo. (Véase: daño derivado).
- **flecha de coste (→)**: separa el coste de una capacidad de sus efectos. (Véase: icono de flecha de coste).
- **icono por jugador ()**: multiplica el valor al que acompaña por el número de jugadores que iniciaron el escenario. (Véase: [icono por jugador](#icono-por-jugador--per-player-icon)).
- **icono de único ()**: indica que la carta representa a una persona, lugar o cosa singular. (Véase: [icono de único ()](#icono-de-único--unique-icon)).

#### conjunto Normal (Standard Set)
El conjunto Normal es un conjunto de encuentros que se añade a la mayoría de los escenarios.

- El conjunto Normal no es un conjunto de encuentros modulares y no puede ser seleccionado (por los jugadores o al azar) cuando un escenario requiere que los jugadores elijan un conjunto de encuentros modulares para incluir en ese escenario.
- Las cartas en la clasificación "Normal" son cualquier carta que tenga la palabra "Normal" impresa en la parte inferior de la carta, en su área de nombre de conjunto de encuentros.

**Véase también**: clasificaciones, Apéndice I: Personalización del mazo.

#### icono de estrella () (Star Icon)
Un icono de estrella se utiliza en conjunto con el campo de atributo o de aumento de una carta para indicar que hay una capacidad obligatoria en el cuadro de texto que corresponde a ese campo. Por sí mismo, el icono de estrella no tiene ningún efecto; es simplemente un recordatorio para comprobar el cuadro de texto de la carta cada vez que se utilice ese campo.

- Si un icono de estrella se encuentra junto al valor de ATQ o PLA de un enemigo, el icono sirve como recordatorio para comprobar el cuadro de texto de ese enemigo cada vez que ese enemigo utilice ese valor para atacar o ejecutar el plan.
- Si un icono de estrella se encuentra en el campo de ATQ o PLA de un accesorio, el icono sirve como recordatorio para comprobar el cuadro de texto de ese accesorio cada vez que el enemigo vinculado utilice el valor que ese campo está modificando para atacar o ejecutar el plan.
- Si un icono de estrella se encuentra junto al valor de ATQ o INT de un aliado, el icono sirve como recordatorio para comprobar el cuadro de texto de ese aliado cada vez que ese aliado utilice ese valor para atacar o intervenir.
- Si un icono de estrella se encuentra junto al ATQ, INT o DEF de un héroe, o junto al valor de REC de un alter ego, el icono sirve como recordatorio para comprobar el cuadro de texto de ese personaje cada vez que utilice ese valor para atacar, intervenir, defender o recuperar.
- Si un paso del juego o una capacidad hace referencia a un poder con el valor de estrella (), ese valor se define en el texto de esa carta. Si no está definido (por ejemplo, si el texto de la carta está anulado), ese valor se trata como 0.
- Si un icono de estrella se encuentra en el campo de aumento de una carta de encuentro, el icono sirve como recordatorio para comprobar el cuadro de texto de esa carta cada vez que esa carta se muestre boca arriba como una carta de aumento durante la activación del villano.

**Véase también**: activación, aliado, accesorio, atributo básico, aumento, identidad, esbirro, variable no numérica, villano.

##### modo heroico (Heroic Mode)
El modo heroico es un nivel de dificultad opcional en el que los jugadores reparten cartas de encuentro adicionales durante la fase del villano.

**Véase también**: fase del villano, dificultad.

#### icono por jugador () (Per Player Icon)
El icono  junto a un valor multiplica ese valor por el número de jugadores que iniciaron el escenario.

- Si un jugador es eliminado, este valor no cambia.

**Véase también**: iconos, modificadores, eliminación de jugador.

#### icono de único () (Unique Icon)
El icono de único indica una carta que representa a una persona, lugar o cosa singular dentro del universo Marvel.

- Dos cartas únicas se considera que "coinciden" si se aplica cualquiera de lo siguiente:
    - Las dos cartas comparten título, y ambas no tienen subtítulo ni título de alter ego. (Por ejemplo, dos copias de la mejora Jarnbjorn, o el aliado Jessica Jones y el esbirro Jessica Jones).
    - El subtítulo o el título de alter ego de una coincide con el título, subtítulo o título de alter ego de la otra. (Por ejemplo, la identidad con el alter ego T'Challa, el aliado T'Challa y el aliado Black Panther con el subtítulo "T'Challa" se considera que todos coinciden).
- Durante la creación del mazo, un jugador no puede incluir varias cartas que coincidan en su mazo. El superhéroe está incluido en esta evaluación.
    - Una vez que ha comenzado la preparación de una partida, a un jugador no se le impide añadir cartas que coincidan a su mazo mediante efectos de juego.
- Al elegir superhéroes durante la preparación, los jugadores no pueden elegir superhéroes que coincidan.
    - Los jugadores pueden elegir un escenario incluso si uno o más villanos coinciden con uno o más superhéroes elegidos.
- Una carta que no sea un villano en un estado fuera de juego que coincida con una carta en juego no puede entrar en juego. Si la carta fuera de juego es:
    - Una carta de jugador: no puede ser jugada ni puesta en juego. Cualquier efecto que intente hacerlo no tiene efecto.
    - Una carta de encuentro que no sea un villano: se descarta y se ignora cualquier efecto de su entrada en juego. Si estaba siendo mostrada, se ignoran todos los efectos de su muestra y se reparte al jugador que la muestra una carta de encuentro boca abajo.

**Véase también**: aliado, entra en juego, superhéroe, esbirro, jugador, subtítulo, villano, Apéndice I: Personalización del mazo.

#### modificadores (Modifiers)
El juego comprueba constantemente y (si es necesario) actualiza la cuenta de cualquier cantidad variable que esté siendo modificada.
Cada vez que se aplica o se quita un nuevo modificador, se recalcula toda la cantidad desde el principio, considerando el valor base no modificado y todos los modificadores activos.

- El icono por jugador () no se considera un modificador y se aplica antes de que se aplique cualquier modificador.
- El cálculo de un valor trata a todos los modificadores como si se aplicaran simultáneamente. Sin embargo, al realizar el cálculo, todos los modificadores aditivos y sustractivos se calculan antes de que se calculen los modificadores de duplicación y/o reducción a la mitad.
- Si un valor se "establece" (set) en un número específico, el modificador de establecimiento anula todos los modificadores que no son de establecimiento. Si múltiples modificadores de establecimiento están en conflicto, el modificador de establecimiento resuelto más recientemente tiene precedencia.
- Después de que se hayan tenido en cuenta todos los modificadores activos, si un valor es inferior a cero, se trata como cero: una carta no puede tener iconos, atributos, rasgos, costes o palabras clave "negativos".
- Los valores fraccionarios se redondean hacia arriba después de que se hayan aplicado todos los modificadores.
- Si la capacidad de una carta hace que un personaje "obtenga" una estadística (como +1 ATQ o 4 puntos de vida), la capacidad modifica la estadística del personaje mientras esté activa.
    - Si dicha capacidad expira o se vuelve inactiva de otro modo, la estadística modificada vuelve al valor que tendría sin el modificador.
- Un valor de guion (–) no puede ser modificado.

**Véase también**: valor base, guion (valor), impreso.

#### elemento de juego (Game Element)
Un elemento de juego es un componente o persona involucrada en jugar una partida de Marvel Champions. Todos los siguientes son elementos de juego:
- Cartas
- Mazos
- Pilas de descarte
- Manos (de cartas)
- Diales de puntos de vida
- Jugadores
- Fichas (tokens)

#### mover (Move)
Algunas capacidades permiten a los jugadores mover elementos de juego, como cartas, daño o amenaza.

- Cuando un elemento se mueve, no puede moverse a su misma ubicación (actual).
- Si no hay un origen o destino válido para un movimiento, el movimiento no puede realizarse.
- Es posible que el daño se mueva entre diales y cartas (y viceversa).
    - Si el daño se mueve de un dial a una carta, aumenta los puntos de vida rastreados por el dial en la cantidad especificada (no superior a los puntos de vida máximos de la carta) y coloca la misma cantidad de daño en la carta.
    - Si el daño se mueve de una carta a un dial, quita el daño de la carta y reduce el dial en la misma cantidad.
- Si el daño se quita de un personaje moviéndolo, se considera que ese daño ha sido curado de dicho personaje.
- Si el daño se mueve a un personaje, se considera que ese daño ha sido infligido a dicho personaje.
- Si la amenaza se quita de un plan moviéndola, se considera que esa amenaza ha sido quitada de dicho plan.
- Si la amenaza se mueve a un plan, se considera que esa amenaza ha sido colocada en dicho plan.

**Véase también**: tipos de cartas, mazo, pila de descartes, jugador, objetivo.

#### en juego y fuera de juego (In Play and Out of Play)
Una carta se considera que está en juego o fuera de juego dependiendo de su estado dentro de la partida.

Si una carta está **en juego**, su texto está activo y puede afectar a la partida.

- Para las cartas de jugador, el lado bocarriba de la carta de superhéroe de un jugador está en juego. Las cartas de aliado, las cartas de apoyo y las cartas de mejora bocarriba que han entrado en juego (jugadas, puestas en juego, etc.) están en juego.
- Para las cartas de encuentro, el lado bocarriba de la carta superior del mazo de villano y el lado bocarriba de la carta superior del mazo de plan principal están en juego. Las cartas de accesorio, las cartas de entorno, las cartas de esbirro, las cartas de obligación y las cartas de plan secundario bocarriba que han entrado en juego (mostradas, puestas en juego, etc.) están en juego.
- Una carta entra en juego cuando se mueve de una zona fuera de juego a una zona de juego.
- Las capacidades de las cartas solo interactúan con, y solo pueden tener como objetivo, cartas que están en juego (a menos que el texto de la capacidad se refiera específicamente a una zona fuera de juego).
- Las capacidades de las cartas en todos los tipos de cartas, excepto las cartas de evento y las cartas de perfidia, solo pueden iniciarse o afectar a la partida mientras están en juego, a menos que se refieran específicamente a ser utilizadas desde una zona fuera de juego.
- Si una carta es de doble cara (teniendo texto de juego en cada lado de la carta), el lado bocarriba de la carta está en juego.

Si una carta está **fuera de juego**, su texto está inactivo y no puede afectar a la partida.

- Las cartas de evento y las cartas de perfidia se resuelven implícitamente desde una zona fuera de juego, en virtud de las reglas pertenecientes a esos tipos de cartas.
- Las cartas en la mano, mazo y pila de descartes de un jugador están fuera de juego.
- Las cartas en el mazo de encuentros, la pila de descartes de encuentros, las cartas no mostradas en el mazo de villano, las cartas no mostradas en el mazo de plan principal y las cartas de encuentro boca abajo repartidas a un jugador están fuera de juego.
- Las cartas boca abajo vinculadas a cartas en juego están fuera de juego.
- Cualquier carta que haya sido eliminada de la partida o que haya sido apartada está fuera de juego.
- Una carta abandona el juego cuando se mueve de una zona de juego a una zona fuera de juego.
- Si una carta es de doble cara (teniendo texto de juego en cada lado de la carta), el lado boca abajo está fuera de juego.

##### eliminado de la partida (Removed from the Game)
Una carta que ha sido eliminada de la partida se aparta y no interactúa con el juego de ninguna manera mientras dure su eliminación. Si no se especifica una duración, una carta que ha sido eliminada de la partida se considera eliminada hasta el final de la partida.

- "Eliminado de la partida" es un estado fuera de juego.
- Una carta que ha sido eliminada de la partida no puede volver a entrar en el juego por ningún medio.

**Véase también**: capacidad, entra en juego, abandona el juego, jugar, restricciones y permisos de juego, apartar, objetivo, zona de victoria.

#### contador de cualquier tipo (All-purpose counter)
Los contadores de cualquier tipo se pueden utilizar para realizar un seguimiento de una variedad de diferentes estados y condiciones del juego. No tienen reglas inherentes.

Las capacidades de las cartas pueden crear y definir varios tipos diferentes de contadores, como "contadores de flecha" o "contadores de telaraña". Si se requiere un contador, se utiliza un contador de cualquier tipo para realizar el seguimiento de su presencia en el juego.

- Los contadores de cualquier tipo se consideran fichas (tokens) para todos los propósitos del juego.
- Una capacidad que se refiere a un "contador de cualquier tipo" puede referirse a cualquier contador de cualquier tipo, independientemente de otros tipos que ese contador pueda tener.
- Cuando un contador de cualquier tipo se mueve de una carta a otra, pierde cualquier tipo previo que tuviera y gana el tipo definido en la nueva carta que ocupa. Si la nueva carta no define un tipo, se considera solo un "contador de cualquier tipo".

**Véase también**: limitaciones de componentes, usos (X "Tipo").

#### Cuadro de texto (Text Box)
El Cuadro de texto de una carta es el área de una carta que contiene las capacidades impresas de la carta, los rasgos y el texto de ambientación (si lo hay).

- Si la capacidad de una carta hace referencia al "Cuadro de texto" de una carta, esa capacidad solo hace referencia a las capacidades impresas dentro del Cuadro de texto de esa carta.
    - Los iconos impresos dentro del Cuadro de texto de una carta se consideran capacidades dentro de ese Cuadro de texto.

**Véase también**: capacidad, impreso, rasgos, Apéndice III: Anatomía de la carta.

#### rasgos (Traits)
Muchas cartas tienen uno o más rasgos enumerados en la parte superior del Cuadro de texto e impresos en negrita y cursiva.

- Los rasgos no tienen efectos inherentes al juego. En su lugar, algunas capacidades de cartas hacen referencia a cartas que poseen o carecen de rasgos específicos.
- Los rasgos no se consideran parte del Cuadro de texto impreso de una carta a efectos de las capacidades de las cartas.

**Véase también**: impreso, Apéndice III: Anatomía de la carta.

#### impreso (Printed)
La palabra "impreso" se refiere al texto, característica o valor que está físicamente impreso en la carta.

- Si un jugador debe pagar un coste utilizando "recursos impresos", puede utilizar los recursos generados por la capacidad de una carta, siempre que el icono(s) del recurso(s) que esa carta genera esté impreso en su cuadro de texto.
    - Los recursos universales () no pueden gastarse como otros tipos de recursos para tal coste.

#### texto de recordatorio (Reminder Text)
Algunas capacidades de las cartas pueden incluir texto de recordatorio. El texto de recordatorio está en cursiva y entre paréntesis (como esto). El texto de recordatorio no tiene ningún efecto en el juego y solo tiene como objetivo recordar a un jugador una función o regla específica del juego.

**Véase también**: valor base, modificadores.
