import {ABILITY_ACTION,TARGET_SIDE} from 'mc-shared';
import {FlipEffect} from '../../effects/flip-effect.js';
import {Engine} from '../../engine/engine.js';
import {FaceDown} from '../match/facedown.js';

export class GameCard extends Engine {
    constructor({
        card,
        index,
        owner,
        boostAbility,
        parent,
        sides = [],
        abilities = [],
    }) {
        super(arguments[0]);

        this.card = card;
        this.index = index;
        this.sides = sides;
        this.abilities = abilities;
        this.owner = owner;
        this.parent = parent;
        this.boostAbility = boostAbility;

        this.faceDown = [];
        this.attached = [];
        this.isPlaying = false;

        this.reset();

        if (this.sides.length) {
            this.id = this.sides.reduce((res, side) => `${res}--${side.id}`, '');

            this.selectedSide = 0;

            this.sides.forEach(sideCard => {
                sideCard.parent = this;
                sideCard.owner = this.owner;
            });
            this.initAbilities();
        } else {
            this.id = index ?`${card.id}-${index}` : card.id;

            this.initAbilities();
        }

        this.isCard = true;
    }
    get owner() {
        return this._owner;
    }
    set owner(owner) {
        this._owner = owner;
        const sides = this.sides || [];

        if (sides.length) {
            sides.forEach(side => {
                side.owner = owner;
            });
        }

        const abilities = this.abilities || [];

        if (abilities.length) {
            abilities.forEach(ability => {
                ability.owner = owner;
            });
        }
    }
    get accelerationIcons() {
        if (this.sides.length) {
            return this.currentSide.accelerationIcons;
        }
        return this.card.accelerationIcons;
    }
    get boost() {
        if (this.sides.length) {
            return this.currentSide.boost;
        }
        return this.card.boost;
    }
    get canDefendBasic() {
        if (this.card.canDefendBasic) {
            return !this.exhausted;
        }

        return false;
    }
    get controller() {
        if (this.sides.length) {
            return this.currentSide.controller;
        }

        return this._controller;
    }
    set controller(controller) {
        const sides = this.sides || [];
        if (sides.length) {
            sides.forEach(side => {
                side.controller = controller;
            });
        } else {
            this._controller = controller;
        }
    }
    get cost() {
        if (this.sides.length) {
            return this.currentSide.cost;
        }

        return this.card.cost;
    }
    get currentSide() {
        if (this.sides.length) {
            return this.sides[this.selectedSide];
        }

        return this;
    }
    get faceTo() {
        if (this.sides.length) {
            return this.currentSide.faceTo;
        }

        return this.card.faceTo;
    }
    get giveToOwner() {
        if (this.sides.length) {
            return this.currentSide.giveToOwner;
        }

        return this.card.giveToOwner;
    }
    get handSize() {
        let handSize = this.card.handSize;

        if (this._modifyHandSize && !this.sides.length) {
            handSize += this._modifyHandSize;
        }

        return handSize;
    }
    set modifyHandSize(modifyHandSize) {
        this._modifyHandSize = modifyHandSize;

        if (this.parent && this.parent.modifyHandSize !== modifyHandSize) {
            this.parent.modifyHandSize = modifyHandSize;
        }
    }
    get hasCrisis() {
        if (this.sides.length) {
            return this.currentSide.hasCrisis;
        }

        return this.card.hasCrisis;
    }
    get hazardIcons() {
        if (this.sides.length) {
            return this.currentSide.hazardIcons;
        }

        return this.card.hazardIcons;
    }
    get isAlly() {
        if (this.sides.length) {
            return this.currentSide.isAlly;
        }

        return this.card.isAlly;
    }
    get isAlterEgo() {
        if (this.sides.length) {
            return this.currentSide.isAlterEgo;
        }

        return this.card.isAlterEgo;
    }
    get isAttachable() {
        return this.card.isAttachable;
    }
    get isAttached() {
        return !!this.attachedTo;
    }
    get isAttachment() {
        if (this.sides.length) {
            return this.currentSide.isAttachment;
        }

        return this.card.isAttachment;
    }
    get isEncounterCard() {
        if (this.sides.length) {
            return this.currentSide.isEncounterCard;
        }

        return this.card.isEncounterCard;
    }
    get isEnemy() {
        return this.isMinion || this.isVillain;
    }
    get isEvent() {
        if (this.sides.length) {
            return this.currentSide.isEvent;
        }

        return this.card.isEvent;
    }
    get isFriendFront() {
        if (this.sides.length) {
            return this.currentSide.isFriendFront;
        }

        return this.card.isFriendFront;
    }
    get isInPlay() {
        const controller = this.controller;

        return !!controller ||
            this.match.villain === this;
    }
    get isHero() {
        if (this.sides.length) {
            return this.currentSide.isHero;
        }

        return this.card.isHero;
    }
    get isMain() {
        if (this.sides.length) {
            return this.currentSide.isMain;
        }

        return this.card.isMain;
    }
    get isMainScheme() {
        if (this.sides.length) {
            return this.currentSide.isMainScheme;
        }

        return this.card.isMainScheme;
    }
    get isMinion() {
        if (this.sides.length) {
            return this.currentSide.isMinion;
        }

        return this.card.isMinion;
    }
    get isObligation() {
        if (this.sides.length) {
            return this.currentSide.isObligation;
        }

        return this.card.isObligation;
    }
    get isPlayerCard() {
        if (this.sides.length) {
            return this.currentSide.isPlayerCard;
        }

        return this.card.isPlayerCard;
    }
    get isScheme() {
        if (this.sides.length) {
            return this.currentSide.isScheme;
        }

        return this.card.isScheme;
    }
    get isSideScheme() {
        if (this.sides.length) {
            return this.currentSide.isSideScheme;
        }

        return this.card.isSideScheme;
    }
    get isSuperhero() {
        if (this.sides.length) {
            return this.currentSide.isSuperhero;
        }

        return this.card.isSuperhero;
    }
    get isSupport() {
        if (this.sides.length) {
            return this.currentSide.isSupport;
        }

        return this.card.isSupport;
    }
    get isUpgrade() {
        if (this.sides.length) {
            return this.currentSide.isUpgrade;
        }

        return this.card.isUpgrade;
    }
    get isTreachery() {
        if (this.sides.length) {
            return this.currentSide.isTreachery;
        }

        return this.card.isTreachery;
    }
    get isVillain() {
        if (this.sides.length) {
            return this.currentSide.isVillain;
        }

        return this.card.isVillain;
    }
    get match() {
        if (this.sides.length) {
            return this.currentSide.match;
        }

        return this.card.match;
    }
    get maxAttach() {
        return this.card.maxAttach;
    }
    get name() {
        if (this.sides.length) {
            return this.currentSide.name;
        }

        return this.card.name;
    }
    get objectToRefresh() {
        return 'card';
    }
    get quickStrike() {
        if (this.sides.length) {
            return this.currentSide.quickStrike;
        }

        return this.card.quickStrike;
    }
    get requirement() {
        return this.card.requirement;
    }
    get resources() {
        if (this.sides.length) {
            return this.currentSide.resources;
        }

        return this.card.resources || [];
    }
    get stage() {
        if (this.sides.length) {
            return this.currentSide.stage;
        }

        return this.card.stage;
    }
    get surge() {
        if (this.sides.length) {
            return this.currentSide.surge;
        }

        return this.card.surge;
    }
    get traits() {
        if (this.sides.length) {
            return this.currentSide.traits;
        }

        return this.card.traits;
    }
    get type() {
        if (this.sides.length) {
            return this.currentSide.type;
        }

        return this.card.type;
    }
    get triggerInstant() {
        if (this.sides.length) {
            return this.currentSide.triggerInstant;
        }

        return this.card.triggerInstant;
    }
    get unique() {
        if (this.sides.length) {
            return this.currentSide.unique;
        }

        return this.card.unique;
    }
    get uses() {
        if (this.sides.length) {
            return this.currentSide.uses;
        }

        return this.card.uses;
    }
    addFaceDown(card) {
        if (card instanceof Array) {
            card.forEach(_card => {
                this.addFaceDown(_card);
            });
        } else {
            const {owner: _owner} = this;

            this.faceDown.push(new FaceDown({
                attached: this,
                card,
            }));
        }
    }
    canAttach() {
        const card = this.sides.length ? this.currentSide : this.card;

        if (card.canAttach) {
            return card.canAttach(arguments[0]);
        }

        return true;
    }
    async canPlay(params) {
        if (! await this.card.canPlay({
            ...params,
            gameCard: this,
        })) {
            return false;
        }

        const {maximum} = this.card;
        if (maximum) {
            const card = this.owner.getPrintedCard(this.card.id);
            if (card) {
                return false;
            }
        }

        return true;
    }
    defeat() {
        return this.discard();
    }
    async discard() {
        if (this.card.isPlayerCard) {
            if (this.controller) {
                this.controller.gameZone.discard(this);
                await this.owner.deck.discard(this);
            }
        } else if (this.card.isEncounterCard) {
            await this.match.scenario.gameZone.discard(this);
            await this.match.scenario.deck.discard(this);
        }

        await this.init();
    }
    endTriggers(force) {
        if (force) {
            this.triggers = {};
        } else {
            this.triggers = Object.keys(this.triggers).reduce((typeRet, typeKey) => {
                const priority = this.triggers[typeKey];

                const _priority = Object.keys(priority).reduce((priorityRet, priorityKey) => {
                    const triggers = priority[priorityKey];

                    const triggersRet = triggers.filter(trigger =>
                        trigger.keepTriggering || trigger.ability?.lasting);

                    if (triggersRet.length) {
                        priorityRet[priorityKey] = triggersRet;
                    }

                    return priorityRet;
                }, {});

                if (Object.keys(_priority).length) {
                    typeRet[typeKey] = _priority;
                }

                return typeRet;
            }, {});
        }

        if (!Object.keys(this.triggers).length) {
            delete this.match.triggerCards[this.id];
        }
    }
    removeLastingTriggers(lasting) {
        Object.keys(this.triggers).forEach(type => {
            const priorities = this.triggers[type];

            Object.keys(priorities).forEach(priority => {
                const remaining = priorities[priority]
                    .filter(trigger => trigger.ability?.lasting !== lasting);

                if (remaining.length) {
                    priorities[priority] = remaining;
                } else {
                    delete priorities[priority];
                }
            });

            if (!Object.keys(priorities).length) {
                delete this.triggers[type];
            }
        });

        if (!Object.keys(this.triggers).length) {
            delete this.match.triggerCards[this.id];
        }
    }
    setExhausted(exhausted) {
        const card = this.parent?.sides?.includes(this) ? this.parent : this;

        card.exhausted = exhausted;
        card.sides.forEach(side => {
            side.exhausted = exhausted;
        });
    }
    exhaust() {
        this.setExhausted(true);
    }
    flip(params) {
        const effect = new FlipEffect({
            selectedTarget: this,
            formTarget: TARGET_SIDE,
            match: this.match,
        });

        return effect.runEffect({
            ...params,
            card: this,
        });
    }
    getAbilitiesType(type) {
        return this.promisesSequentialFilter(this.abilities, ability => {
            switch (type) {
                case ABILITY_ACTION:
                    if (!ability.isAction) {
                        return false;
                    }
                    break;
                default:
                    return false;
            }

            return ability.canRun({
                player: this.owner,
            });
        });
    }
    getCard(cardId) {
        if (this.id === cardId) {
            return this;
        }

        return this.attached.find(card => card.id === cardId);
    }
    hasResourceGenerators(cardToPay, resourceType) {
        return this.promisesSequentialSome(this.abilities, ability => {
            if (ability.isResource) {
                return ability.canRun({
                    player: this.controller,
                    card: this,
                    cardToPay,
                    resourceType,
                });
            }

            return false;
        });
    }
    async init() {
        if (this.attachedTo) {
            await this.attachedTo.removeAttached(this);
        }

        if (this.engaged) {
            this.engaged.removeEngaged(this);
        }

        await this.removeFaceDown();
        await this.removeAttached();

        this.reset();
    }
    addAccelerationToken(count = 1) {
        this.accelerationTokens += count;
    }
    initAbilities() {
        const {abilities} = this;

        if (abilities) {
            abilities.forEach(ability => {
                ability.card = this;
            });
        }
    }
    initTriggers(params) {
        return this.promisesSequential(this.currentSide.abilities, async ability => {
            await ability.initTriggers(this, params);
        });
    }
    placeCounters(counters) {
        if (this.counters === undefined) {
            this.counters = 0;
        }
        this.counters += counters;

        return counters;
    }
    placeDamage(damage) {
        this.damage += damage;

        return damage;
    }
    ready() {
        this.setExhausted(false);
    }
    async remove() {
        this.controller.gameZone.remove(this);
        this.owner.gameZone.remove(this);

        this.match.removeCard(this);

        await this.init();
    }
    async removeAttached(card) {
        if (card) {
            const index = this.attached.indexOf(card);
            if (index > -1) {
                this.attached.splice(index, 1);
            }
        } else {
            await this.promisesSequential(this.attached, async attached => {
                attached.attachedTo = undefined;
                await attached.discard();
            });

            this.attached = [];
        }
    }
    removeDamage(damage) {
        let heal;

        if (damage > this.damage) {
            heal = this.damage;
        } else {
            heal = damage;
        }

        this.damage -= heal;

        return heal;
    }
    async removeFaceDown() {
        await this.promisesSequential(this.faceDown, f => f.discard());

        this.faceDown = [];
    }
    removeCounters(count) {
        this.counters -= count;
    }
    reset() {
        this.damage = 0;
        this.counters = undefined;
        this.setExhausted(false);
        this.attachedTo = undefined;
        this.accelerationTokens = 0;
        this.controller = undefined;
        this.canceled = undefined;
    }
    resolveAbility(params) {
        const {currentSide: {abilities}} = this;

        const {abilityIndex} = params;
        const ability = abilities[abilityIndex];

        if (ability &&
            (ability.isAction || ability.isBasic)) {
            return ability.resolveAbility({
                ...params,
                card: this
            });
        }
    }
    async resolveBoost(params) {
        if (this.card.boostAbility) {
            await this.card.boostAbility.resolveAbility({
                ...params,
                card: this
            });
        }
        return this.card.boost || 0;
    }
    resolveResourceAbility() {
        const ability = this.abilities.find(_ability => _ability.isResource);

        return ability.resolveAbility(arguments[0]);
    }
    returnFaceDown(faceDown) {
        if (faceDown === undefined) {
            this.faceDown.forEach(f => {
                this.returnFaceDown(f);
            });
        } else {
            faceDown.owner.hand.addCards([faceDown.card]);
            const index = this.faceDown.indexOf(faceDown);
            if (index > -1) {
                this.faceDown.splice(index, 1);
            }
        }
    }
    setup() {
        if (this.sides.length) {
            return this.currentSide.setup(arguments[0]);
        }
        const ability = this.abilities.find(_ability => _ability.isSetup);

        if (ability) {
            return ability.resolveAbility(arguments[0]);
        }
    }
    toObj() {
        if (this.sides.length) {
            return {
                ...this.currentSide.toObj(arguments[0]),
            };
        }

        const {
            id,
            abilities,
            accelerationTokens,
            attached,
            faceDown,
            boost,
            card,
            cost,
            counters,
            damage,
            exhausted,
            parent,
            isAttached,
            isAlly,
            isSideScheme,
            isSupport,
            isUpgrade,
        } = this;

        return {
            ...card.toObj(arguments[0]),
            id,
            parentId: parent && parent.id,
            cost,
            counters,
            exhausted,
            damage,
            boost,
            accelerationTokens,
            isAttached,
            isAlly,
            isSideScheme,
            isSupport,
            isUpgrade,
            attached: attached.map(_attached => _attached.toObj(arguments[0])),
            faceDown: faceDown.map(_facedown => _facedown.toObj(arguments[0])),
            abilities: abilities.map((ability, index) => ({
                ...ability.toObj(arguments[0]),
                index,
            })),
        };
    }
    async toObjWithAbilityAvailability(player) {
        const serializedCard = this.toObj();
        const attached = await Promise.all(this.attached.map(card =>
            card.toObjWithAbilityAvailability(player)));
        const abilities = await Promise.all(this.currentSide.abilities.map(async (ability, index) => {
            const serializedAbility = {
                ...ability.toObj(),
                index,
            };

            if (!ability.isAction && !ability.isBasic) {
                return serializedAbility;
            }

            ability.prepareEffect();

            return {
                ...serializedAbility,
                disable: !(await ability.canRun({
                    player,
                    card: this,
                })),
            };
        }));

        return {
            ...serializedCard,
            attached,
            abilities,
            playable: abilities.some(ability =>
                (ability.isAction || ability.isBasic) && !ability.disable),
        };
    }
}
