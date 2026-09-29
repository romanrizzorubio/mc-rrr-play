import {GameCard} from "./game-card.js";
import {STATUS_NONE, STATUS_STALWART, STATUS_STEADY} from "../../constants/status.js";
import {AttackBasicAbility} from "../../abilities/basic/attack-basic-ability.js";
import {ThwartBasicAbility} from "../../abilities/basic/thwart-basic-ability.js";
import {RecoveryBasicAbility} from "../../abilities/basic/recovery-basic-ability.js";
import {QuickstrikeAbility} from "../../abilities/misc/quickstrike-ability.js";

export class CharacterGameCard extends GameCard {
    constructor({
// GameCard
        card, index, owner, sides = [], abilities = [],
    }) {
        super(arguments[0]);

        this.damage = 0;
        this._stunned = 0;
        this._confused = 0;
        this._tough = 0;

        this.modifyHitPoints = 0;
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

        this.attached.forEach(card => {
            if (card.card.attack) {
                attack += card.card.attack;
            }
        })

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
        return this.card.defense;
    }
    get gameZone() {
        if (this.isMinion) {
            return this.engaged.gameZone;
        } else if (this.isAlly) {
            return this.controller.gameZone;
        } else {
            console.log(this);
        }
    }
    get guard() {
        return this.card.guard;
    }
    get hitPoints() {
        if (this.sides.length) {
            return this.currentSide.hitPoints + this.modifyHitPoints;
        }
        return this.card.hitPoints + this.modifyHitPoints;
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
    get recovery() {
        return this.card.recovery;
    }
    get scheme() {
        return this.card.scheme;
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
        return this.card.thwart;
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
    toObj() {
        const {life, attack, stunned, confused, tough} = this;

        return {
            ...super.toObj(arguments[0]),
            life,
            attack,
            statusCards: {
                stunned,
                confused,
                tough,
            }
        }
    }
}