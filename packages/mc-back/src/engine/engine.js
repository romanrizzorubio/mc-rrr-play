import {
    MANDATORY_PRIORITIES, PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
} from "../constants/priorities.js";
import {Trigger} from "../triggers/base/trigger.js";
import {path} from "./utils.js";
import {endpoints} from "../constants/endpoints.js";
import {DIALOG_LIST, DIALOG_USE_CARD} from "../constants/dialogs.js";
import {TriggersFactory} from "../factory/triggers-factory.js";

export class Engine {
    static isMandatory(priority) {
        return MANDATORY_PRIORITIES.some(p => p === priority);
    }
    constructor() {
        this.triggers = {};

        if (!Engine.triggersFactory) {
            Engine.triggersFactory = new TriggersFactory();
        }
    }
    get triggersFactory() {
        return Engine.triggersFactory;
    }
    get currentRound() {
        return Engine.currentRound;
    }
    get objectToRefresh() {
        return '';
    }
    get socket() {
        return global.socket;
    }
    _getTriggers(type, priority, params, exclude = []) {
        const {match} = this;
        if (!match) {
            console.log('Falta Match');
        }

        return this.promisesSequentialReduce(Object.keys(match.triggerCards), async (ret, cardId) => {
            const card = match.triggerCards[cardId];

            await this.promisesSequential(Object.keys(card.triggers), async triggerKey => {
                if (type.indexOf(triggerKey) > -1) {
                    const trigger = card.triggers[triggerKey];

                    await this.promisesSequential(Object.keys(trigger), async triggersPriority => {
                        if (triggersPriority === priority) {
                            const filtered = await this.promisesSequentialFilter(trigger[triggersPriority], async _trigger =>
                                exclude.indexOf(_trigger) === -1 &&
                                await _trigger.canTrigger(params))

                            ret = ret.concat(filtered);
                        }
                    })
                }
            })

            return ret;
        }, [])
    }
    _getDialogTitle(priority, singular) {
        switch (priority) {
            case PRIORITY_CONSTANT:
                return singular ? 'Se va a activar la siguiente Carta' : '¿Qué Constante quieres activar primero?';
            case PRIORITY_FORCED_INTERRUPT:
                return singular ? 'Se va a activar la siguiente Interrupción' : '¿Qué Interrupción quieres activar primero?';
            case PRIORITY_INTERRUPT:
                return '¿Quieres usar alguna Interrupción?';
            case PRIORITY_FORCED_RESPONSE:
                return singular ? 'Se va a activar la siguiente Respuesta' : '¿Qué Respuesta quieres activar primero?';
            case PRIORITY_RESPONSE:
                return '¿Quieres usar alguna Respuesta?';
        }
    }
    async _openTriggersDialogCard(cards, cardsTriggers, title, mandatory, params) {
        const {player} = params;

        const _shouldShow = () => {
            if (cards.length > 1) {
                return true;
            }

            const card = cardsTriggers[cards[0].id];

            if (card.triggers.length === 1) {
                const trigger = card.triggers[0];

                if (trigger instanceof Trigger) {
                    if (trigger.ability.isEndLasting ||
                        trigger.ability.hideDialog) {
                        return false;
                    }
                    return true;
                }
            }

            return false;
        }

        if (_shouldShow()) {
            const {selected} = await this.openDialog({
                dialogType: DIALOG_USE_CARD,
                title,
                hand: player.hand.cards.map(card => card.toObj(arguments[0])),
                hideOk: mandatory,
                data: {
                    cards: cards.map(card => card.toObj(arguments[0])),
                    mandatory,
                },
            });

            if (selected) {
                return cardsTriggers[selected.id];
            }
        } else {
            return cardsTriggers[cards[0].id];
        }

    }
    async _openTriggersDialogTriggers(card, mandatory, params) {
        const {player} = params;

        const _createOptions = (triggers, prefix = '') => {
            const _createId = index => prefix ? `${prefix}.${index}` : `${index}`;

            return triggers.reduce((ret, trigger, index) => {
                const id = _createId(index);

                const text = trigger instanceof Trigger ?
                    trigger.getName(params) :
                    trigger.name;

                const option = {
                    id,
                    text,
                };

                if (trigger.triggers) {
                    const {optionsToShow} = _createOptions(trigger.triggers, id);
                    option.triggers = optionsToShow;
                    ret.optionsToShow.push(option);
                } else if (!trigger.ability.hideDialog) {
                    ret.optionsToShow.push(option);
                }

                ret.options.push(option);

                return ret;
            }, {
                options: [],
                optionsToShow: [],
            })
        }

        const {options, optionsToShow} = _createOptions(card.triggers);
        let selected;
        if (optionsToShow.length > 1 ||
            (optionsToShow.length === 1 && optionsToShow[0].triggers && optionsToShow[0].triggers.length > 1)) {
            const result = await this.openDialog({
                dialogType: DIALOG_LIST,
                hideOk: mandatory,
                hand: player.hand.cards.map(card => card.toObj(arguments[0])),
                title: 'Elige una opción',
                data: {
                    options: optionsToShow,
                    card: card.card.toObj(arguments[0]),
                },
            });

            selected = result.selected;
        } else {
            selected = options[0];
        }

        const _getOption = (triggers, id) => {
            const parts = id.split('.');
            const first = parseInt(parts.shift());

            const val = triggers[first];

            if (parts.length) {
                return _getOption(val.triggers, parts.join('.'));
            }

            return val;
        };

        return _getOption(card.triggers, selected.id);
    }
    async _getCardTriggers(triggers, params) {
        const cards = [];

        const cardsTriggers = await this.promisesSequentialReduce(triggers, async (ret, trigger) => {
            if (!ret[trigger.card.id]) {
                cards.push(trigger.card);
                ret[trigger.card.id] = {
                    card: trigger.card,
                    triggers: [],
                };
            }

            if (trigger.isChoose || trigger.isChooseAbility) {
                const options = path(trigger, 'ability.effect.options');
                const name = path(trigger, 'ability.name');

                const filtered = await this
                    .promisesSequentialFilter(options,
                            option => option.canRun(params))

                ret[trigger.card.id].triggers.push({
                    name,
                    triggers: filtered
                        .map(option => this.triggersFactory.createTrigger({
                            card: trigger.card,
                            ability: option,
                            type: trigger.trigger,
                            triggerParams: trigger.triggerParams,
                        }))
                });
            } else {
                ret[trigger.card.id].triggers.push(trigger);
            }

            return ret;
        }, {})

        return {
            cards,
            cardsTriggers,
        }
    }
    _getPlayersTriggers(triggers) {
        return triggers.reduce((players, trigger) => {
            if (players.indexOf(trigger.card.owner) === -1) {
                players.push(trigger.card.owner);
            }

            return players;
        }, []);
    }
    async _openTriggersDialog(triggers, priority, params) {
        const {cards, cardsTriggers} = await this._getCardTriggers(triggers, params);

        const title = this._getDialogTitle(priority, cards.length === 1)
        const mandatory = Engine.isMandatory(priority)

        const players = this._getPlayersTriggers(triggers);
        const player = players[0];
        if (!params.player) {
            params.player = player;
        }

        const selectedCard = await this._openTriggersDialogCard(cards, cardsTriggers, title, mandatory, params);

        if (selectedCard) {
            const selectedTrigger = await this._openTriggersDialogTriggers(selectedCard, mandatory, params);

            if (selectedTrigger) {
                await selectedTrigger.runTrigger(params);

                return selectedTrigger;
            }
        }
    }
    calcPerPlayer(value) {
        if (value instanceof Array) {
            const [_value, _perPlayer] = value;

            if (_perPlayer) {
                return _value * this.match.numPlayers;
            }
        }

        return value
    }
    endLimit(time) {
        if (this.match.limits[time]) {
            this.match.limits[time].forEach(limit => {
                limit.clean();
            });
        }

        delete this.match.limits[time];
    }
    endTriggers() {
        const {match, id} = this;
        if (!match) {
            console.log('Falta Match');
        }

        this.triggers = {};

        delete match.triggerCards[id];
    }
    initTrigger({
        type,
        priority,
        ability,
        card,
    }) {
        const {match} = this;
        if (!match) {
            console.log('Falta Match');
        }
        const trigger = this.triggersFactory.createTrigger({
            card,
            type,
            ability,
            triggerParams: ability.triggerParams,
        })
        if (!card.triggers[type]) {
            card.triggers[type] = {};
        }
        const triggersType = card.triggers[type];

        if (!triggersType[priority]) {
            triggersType[priority] = [];
        }
        const triggersPriority = triggersType[priority];

        triggersPriority.push(trigger);

        match.triggerCards[card.id] = card;
    }
    openDialog(params) {
        if (!this.match) {
            console.log('Falta Match')
        }
        return this.match.openDialog(params);
    }
    refresh() {
        const {match, objectToRefresh} = this;

        if (!match) {
            console.log('Falta Match');
        }

        match.mc.mcSocket.send(endpoints[objectToRefresh].refresh, this.toObj())
    }
    setLimit(limit) {
        if (!this.match.limits[limit.time]) {
            this.match.limits[limit.time] = [];
        }

        this.match.limits[limit.time].push(limit);
    }
    checkTrigger() {
        return true;
    }
    createLasting(lasting) {
        this.match.lasting.push(lasting);
    }
    async trigger(priority, type, params) {
        const triggered = [];

        let triggers = await this._getTriggers(type, priority, params);

        while (triggers.length) {
            const trigger = await this._openTriggersDialog(triggers, priority, params);

            if (!trigger) {
                break;
            } else if (trigger.triggered) {
                if (trigger.ability.isOptionAbility) {
                    triggers.forEach(_trigger => {
                        if (_trigger.ability.effect === trigger.ability.parent) {
                            triggered.push(trigger);
                        }
                    });
                } else {
                    triggered.push(trigger);
                }

                triggers = await this._getTriggers(type, priority, params, triggered);
            }
        }

        return this.checkTrigger(params);
    }
    async promisesSequential(items, callback) {
        for (const item of items) {
            const result = await callback(item);

            if (result === false) {
                break;
            }
        }
    }
    async promisesSequentialEvery(items, callback) {
        for (const item of items) {
            const result = await callback(item);

            if (!result) {
                return false;
            }
        }

        return true;
    }
    async promisesSequentialFilter(items, callback) {
        const result = [];

        for (const item of items) {
            const insert = await callback(item);

            if (insert) {
                result.push(item);
            }
        }

        return result;
    }
    async promisesSequentialReduce(items, callback, result) {
        let _result = result;

        for (const item of items) {
            _result = await callback(_result, item);
        }

        return _result;
    }
    async promisesSequentialSome(items, callback) {
        for (const item of items) {
            const result = await callback(item);

            if (result) {
                return true;
            }
        }
    }
    toObj() {
        return {}
    }
}