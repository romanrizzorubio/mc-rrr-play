import {AttackBasicAbility} from '../../abilities/basic/attack-basic-ability.js';
import {RecoveryBasicAbility} from '../../abilities/basic/recovery-basic-ability.js';
import {ThwartBasicAbility} from '../../abilities/basic/thwart-basic-ability.js';
import {QuickstrikeAbility} from '../../abilities/misc/quickstrike-ability.js';
import {REFRESH_EVENTS} from 'mc-endpoints';
import {STATUS_NONE, STATUS_STALWART, STATUS_STEADY} from 'mc-shared';
import {Calc} from '../../engine/calc.js';

import {GameCard} from './game-card.js';
import {GetAttackEffect} from '../../effects/get-attack-effect.js';
import {GetDefenseEffect} from '../../effects/get-defense-effect.js';
import {GetHitPointsEffect} from '../../effects/get-hit-points-effect.js';
import {GetTraitsEffect} from '../../effects/get-traits-effect.js';
import {GetThwartEffect} from '../../effects/get-thwart-effect.js';

export class CharacterGameCard extends GameCard {
    constructor({
// GameCard
        card: _card, index: _index, owner: _owner, sides: _sides = [], abilities: _abilities = [],
    }) {
        super(arguments[0]);

        this.damage = 0;
        this._stunned = 0;
        this._confused = 0;
        this._tough = 0;

        this.modifyHitPoints = 0;
        this.modifyAttack = 0;
        this.modifyThwart = 0;
        this.extraTraits = [];

        this.engaged = null;

        if (this.isFriendFront) {
            if (!this.abilities) {
                this.abilities = [];
            }
            this.abilities.unshift(new AttackBasicAbility({
                card: this,
                name: 'Ataque',
                match: this.match,
            }));
            this.abilities.unshift(new ThwartBasicAbility({
                card: this,
                name: 'Intervención',
                match: this.match,
            }));
        }
        if (this.isAlterEgo) {
            if (!this.abilities) {
                this.abilities = [];
            }
            this.abilities.unshift(new RecoveryBasicAbility({
                card: this,
                name: 'Recuperación',
                match: this.match,
            }));
        }
        if (this.quickStrike) {
            if (!this.abilities) {
                this.abilities = [];
            }
            this.abilities.unshift(new QuickstrikeAbility({
                card: this,
                match: this.match,
            }));
        }
    }

    get attack() {
        let attack = this.card.attack;

        if (attack instanceof Object) {
            const calc = new Calc(attack);
            attack = calc.calculate({
                card: this,
                match: this.match,
            });
        }

        this.attached.forEach(card => {
            if (card.card.attack) {
                attack += card.card.attack;
            }
        });

        if (Number.isFinite(attack)) {
            attack += this.modifyAttack;
        }

        return attack;
    }
    get attackConsequencial() {
        return this.card.attackConsequencial;
    }
    get canHeal() {
        return !!this.damage;
    }
    get confused() {
        return this._confused;
    }
    set confused(confused) {
        this._confused = confused;

        if (this.parent && this.parent.confused !== confused) {
            this.parent.confused = confused;
        }
        if (this.sides.length) {
            this.sides.forEach(side => {
                if (side.confused !== confused) {
                    side.confused = confused;
                }
            });
        }
    }
    get defense() {
        let defense = this.card.defense;

        if (defense instanceof Object) {
            const calc = new Calc(defense);
            defense = calc.calculate({
                card: this,
                match: this.match,
            });
        }

        return defense;
    }
    get gameZone() {
        if (this.isMinion) {
            return this.engaged.gameZone;
        } else if (this.isAlly) {
            return this.controller.gameZone;
        }
    }
    get guard() {
        return this.card.guard;
    }
    get retaliate() {
        const retaliate = this.sides.length ?
            this.currentSide.retaliate :
            this.card.retaliate;

        return this.attached.reduce(
            (total, attachment) => total + attachment.card.retaliate,
            retaliate
        );
    }
    get hitPoints() {
        if (this.sides.length) {
            return this.currentSide.hitPoints + this.modifyHitPoints;
        }
        return this.card.hitPoints + this.modifyHitPoints;
    }
    async getHitPoints({player: effectPlayer} = {}) {
        const {owner} = this;

        if (owner && owner.isPlayer && this.isSuperhero) {
            return owner.getHitPoints();
        }
        const getHitPointsEffect = new GetHitPointsEffect({
            selectedTarget: this,
            match: this.match,
        });
        const player = effectPlayer || (this.controller?.isPlayer ?
            this.controller :
            this.match.initialPlayer);

        await getHitPointsEffect.runEffect({
            player,
        });

        return getHitPointsEffect.hitPoints;
    }
    async getAttackValue(params) {
        const getAttackEffect = new GetAttackEffect({
            selectedTarget: this,
            match: this.match,
        });

        await getAttackEffect.runEffect(params);

        return getAttackEffect.attack;
    }
    async getDefenseValue(params) {
        const getDefenseEffect = new GetDefenseEffect({
            selectedTarget: this,
            match: this.match,
        });

        await getDefenseEffect.runEffect(params);

        return getDefenseEffect.defense;
    }
    async getThwartValue(params) {
        const getThwartEffect = new GetThwartEffect({
            selectedTarget: this,
            match: this.match,
        });

        await getThwartEffect.runEffect(params);

        return getThwartEffect.thwart;
    }
    get isConfused() {
        switch (this.statusAvailable) {
            case STATUS_STEADY:
                return this.confused === 2;
            case STATUS_STALWART:
                return false;
            case STATUS_NONE:
                return this.confused === 1;
        }
    }
    get isNemesis() {
        return this.card.nemesis;
    }
    get isStunned() {
        switch (this.statusAvailable) {
            case STATUS_STEADY:
                return this.stunned === 2;
            case STATUS_STALWART:
                return false;
            case STATUS_NONE:
                return this.stunned === 1;
        }
    }
    get isTough() {
        return this.tough > 0;
    }
    get life() {
        return this.hitPoints - this.damage;
    }
    async getLife() {
        const hitPoints = await this.getHitPoints();

        return hitPoints - this.damage;
    }
    get recovery() {
        let recovery = this.card.recovery;

        if (recovery instanceof Object) {
            const calc = new Calc(recovery);
            recovery = calc.calculate({
                card: this,
                match: this.match,
            });
        }

        return recovery;
    }
    get scheme() {
        const card = this.sides.length ? this.currentSide : this.card;
        let scheme = card.scheme;

        if (scheme instanceof Object) {
            const calc = new Calc(scheme);
            scheme = calc.calculate({
                card: this,
                match: this.match,
            });
        }

        if (Number.isFinite(scheme)) {
            this.attached.forEach(attachment => {
                let attachedScheme = attachment.card.scheme;
                if (attachedScheme instanceof Object) {
                    const calc = new Calc(attachedScheme);
                    attachedScheme = calc.calculate({
                        card: attachment,
                        match: this.match,
                    });
                }

                if (Number.isFinite(attachedScheme)) {
                    scheme += attachedScheme;
                }
            });
        }

        return scheme;
    }
    get statusAvailable() {
        if (this.sides.length) {
            return this.currentSide.card.statusAvailable;
        }

        return this.card.statusAvailable;
    }
    get stunned() {
        return this._stunned;
    }
    set stunned(stunned) {
        this._stunned = stunned;

        if (this.parent && this.parent.stunned !== stunned) {
            this.parent.stunned = stunned;
        }
        if (this.sides.length) {
            this.sides.forEach(side => {
                if (side.stunned !== stunned) {
                    side.stunned = stunned;
                }
            });
        }
    }
    get traits() {
        let traits = this.card.traits || [];
        if (this.sides.length) {
            traits = this.currentSide.traits || [];
        }
        return [...traits, ...this.extraTraits];
    }
    get thwart() {
        let thwart = this.card.thwart;

        if (thwart instanceof Object) {
            const calc = new Calc(thwart);
            thwart = calc.calculate({
                card: this,
                match: this.match,
            });
        }

        if (Number.isFinite(thwart)) {
            thwart += this.modifyThwart;
        }

        return thwart;
    }
    get thwartConsequencial() {
        return this.card.thwartConsequencial;
    }
    get tough() {
        return this._tough;
    }
    set tough(tough) {
        this._tough = tough;

        if (this.parent && this.parent.tough !== tough) {
            this.parent.tough = tough;
        }
        if (this.sides.length) {
            this.sides.forEach(side => {
                if (side.tough !== tough) {
                    side.tough = tough;
                }
            });
        }
    }
    get toughness() {
        return this.card.toughness;
    }
    get villainous() {
        return this.card.villainous;
    }
    canBeAttacked(player) {
        return ((this.isVillain && !player.hasGuard) ||
            this.isMinion);
    }
    confuse() {
        if (!this.isConfused) {
            if (this.isInPlay) {
                this.confused++;

                return this.confused;
            }
        }

        return 0;
    }
    async defeat(player) {
        if (this.isVillain) {
            await this.match.scenario.selectVillain(player);
        } else if (this.isSuperhero) {
            this.stunned = 0;
            this.confused = 0;
            this.tough = 0;

            await this.owner.defeat();
        } else {
            this.stunned = 0;
            this.confused = 0;
            this.tough = 0;

            await super.defeat();
        }
    }
    healDamage(damage) {
        return this.removeDamage(damage);
    }
    removeConfused(count = 0) {
        if (count) {
            this.confused -= count;
        } else {
            this.confused = 0;
        }
    }
    removeStunned(count = 0) {
        if (count) {
            this.stunned -= count;
        } else {
            this.stunned = 0;
        }
    }
    removeTough(count = 0) {
        if (count) {
            this.tough -= count;
        } else {
            this.tough = 0;
        }
    }
    setTough() {
        if (this.tough < this.card.maxTough) {
            if (this.isInPlay) {
                this.tough++;
            }
        }
    }
    stun() {
        if (!this.isStunned) {
            if (this.isInPlay) {
                this.stunned++;

                return this.stunned;
            }
        }

        return 0;
    }
    async getEffectiveStats() {
        const {controller, match} = this;
        const player = controller?.isPlayer ?
            controller :
            match.initialPlayer || controller;

        if (!player) {
            throw new Error(`Character ${this.id} has no player for stat calculation.`);
        }

        const params = {
            player,
            card: this,
        };
        const attack = Number.isFinite(this.attack) ?
            await this.getAttackValue(params) :
            this.attack;
        const thwart = Number.isFinite(this.thwart) ?
            await this.getThwartValue(params) :
            this.thwart;
        const defense = Number.isFinite(this.defense) ?
            await this.getDefenseValue(params) :
            this.defense;
        const hitPoints = await this.getHitPoints({player});

        return {
            attack,
            thwart,
            defense,
            hitPoints,
            life: hitPoints - this.damage,
        };
    }
    async getEffectiveTraits() {
        const {controller} = this;

        if (!controller) {
            throw new Error(`Character ${this.id} has no controller for trait calculation.`);
        }

        const getTraitsEffect = new GetTraitsEffect({
            selectedTarget: this.currentSide,
            match: this.match,
        });
        await getTraitsEffect.runEffect({player: controller});

        return getTraitsEffect.traits;
    }
    async refresh() {
        const {controller, match} = this;
        const player = controller?.isPlayer ? controller : match.initialPlayer;
        const card = await this.toObjWithAbilityAvailability(player);

        match.mc.mcSocket.send(match.name, REFRESH_EVENTS[this.objectToRefresh], card);
    }
    async toObjWithAbilityAvailability(player) {
        const serializedCard = await super.toObjWithAbilityAvailability(player);

        return {
            ...serializedCard,
            ...await this.getEffectiveStats(),
        };
    }
    toObj() {
        const {
            hitPoints,
            life,
            attack,
            thwart,
            defense,
            recovery,
            scheme,
            extraTraits: ownExtraTraits,
            stunned,
            confused,
            tough,
        } = this;
        const extraTraits = this.sides.length ?
            [...this.currentSide.extraTraits, ...ownExtraTraits] :
            ownExtraTraits;

        return {
            ...super.toObj(arguments[0]),
            hitPoints,
            life,
            attack,
            thwart,
            defense,
            recovery,
            scheme,
            extraTraits: [...new Set(extraTraits)],
            statusCards: {
                stunned,
                confused,
                tough,
            }
        };
    }
}