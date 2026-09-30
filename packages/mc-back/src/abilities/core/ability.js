import {LABEL_ATTACK, LABEL_DEFENSE, LABEL_THWART} from '../../constants/labels.js';
import {Engine} from '../../engine/engine.js';
import {Limit} from '../../model/commons/limit.js';
import {Maximum} from '../../model/commons/maximum.js';

export class Ability extends Engine {
    constructor({
// Ability
        name = '',
        labels = [],
        effect,
        limit,
        maximum,
        arrow,
        ifNot,
        card,
        match,
        hideDialog = false,
        workInHand = false,
    }) {
        super(arguments[0]);

        this.name = name;
        this.labels = labels;
        this.effect = effect;
        this.card = card;
        this.hideDialog = hideDialog;
        this.workInHand = workInHand;
        this.match = match;
        if (!match) {
            console.log('Falta Match');
        }

        if (limit) {
            this.limit = new Limit({
                ...limit,
                ability: this
            });
        }
        if (maximum) {
            this.maximum = new Maximum({
                ...maximum,
                ability: this
            });
        }
        if (arrow) {
            this.arrow = arrow;
            arrow.cost.ability = this;
        }
        if (ifNot) {
            this.ifNot = ifNot;
        }
        if (effect) {
            effect.ability = this;
        }

        this.resolved = false;
        this.owner = undefined;

        this.isAction = false;
        this.isBasic = false;
        this.isResource = false;
        this.isSetup = false;
        this.isWhenRevealed = false;
        this.isWhenDefeated = false;
        this.isEndLasting = false;
        this.isOptionAbility = false;
    }
    get card() {
        return this._card;
    }
    set card(card) {
        this._card = card;

        if (this.effect && this.effect.isChooseAbility) {
            this.effect.options.forEach(option => {
                option.card = card;
            });
        }
    }
    get character() {
        if (this._card) {
            if (this._card.isEvent) {
                return this._card.owner;
            } else if (this._card.isUpgrade) {
                return this._card.controller;
            }
        }

        return this._card;
    }
    get id() {
        return `${this.card.id}--${this.name}`;
    }
    get isAttack() {
        const {labels} = this;

        return labels.some(label => label === LABEL_ATTACK);
    }
    get isDefense() {
        const {labels} = this;

        return labels.some(label => label === LABEL_DEFENSE);
    }
    get isThwart() {
        const {labels} = this;

        return labels.some(label => label === LABEL_THWART);
    }
    get keepTriggering() {
        return this.effect.keepTriggering;
    }
    isValidIdentity() {
        return true;
    }
    async canRun(params) {
        const {player} = params;

        if (this.isAttack) {
            if (! player.canAttack(params)) {
                return false;
            }
        }
        if (this.isThwart) {
            if (! player.canThwart(params)) {
                return false;
            }
        }
        if (this.isDefense) {
            if (! player.canDefend(params)) {
                return false;
            }
        }
        if (this.limit) {
            if (!this.limit.canUse(params)) {
                return false;
            }
        }
        if (this.arrow) {
           if (! await this.arrow.canPay(params)) {
               return false;
           }
        }
        if (this.effect) {
            if (! await this.effect.canRun(params)) {
                return false;
            }
        }

        return true;
    }
    canTrigger() {
        return false;
    }
    getTitle() {
        return this.name;
    }
    getValidTarget(match, player) {
        return this.effect.getValidTarget(match, player);
    }
    initTriggers() {}
    async payArrow(params) {
        if (this.arrow) {
            return await this.arrow.pay(params);
        }

        return true;
    }
    useLimit() {
        if (this.limit) {
            this.limit.use();
        }
    }
    async resolveAbility(params) {
        const {player} = params;

        if (this.effect) {
            this.effect.selectedTarget = undefined;

            this.effect.isAttack = this.effect.isAttack || this.isAttack;
            this.effect.isDefense = this.effect.isDefense || this.isDefense;
            this.effect.isScheme = this.effect.isScheme || this.isScheme;
            this.effect.isThwart = this.effect.isThwart || this.isThwart;
        }

        if (await this.canRun(params)) {
            const arrowPaid = await this.payArrow(params);

            if (arrowPaid) {
                if (this.effect) {
                    await this.effect.runEffect({
                        ...params,
                        player,
                    });

                    this.resolved = this.effect.resolved;
                }
                this.useLimit();
            }
        } else if (this.ifNot) {
            await this.ifNot.runEffect({
                ...params,
                card: params.card || this.card,
            });

            this.resolved = this.ifNot.resolved;
        }
    }

    toObj() {
        const {name, isAction, isBasic, isResource} = this;

        return {
            name,
            isAction,
            isBasic,
            isResource,
            //arrow: arrow && arrow.toObj(arguments[0]),
            //effect: effect && effect.toObj(arguments[0]),
        };
    }
}