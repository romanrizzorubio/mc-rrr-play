import {Trigger} from "../triggers/base/trigger.js";
import {AttachedDefeatTrigger, TRIGGER_ATTACHED_DEFEAT} from "../triggers/attached-defeat-trigger.js";
import {AttachedWouldAttackTrigger, TRIGGER_ATTACHED_WOULD_ATTACK} from "../triggers/attached-would-attack-trigger.js";
import {
    AttachedWouldDealtDamageTrigger,
    TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE
} from "../triggers/attached-would-dealt-damage-trigger.js";
import {ConditionGetDefenseTrigger, TRIGGER_CONDITION_GET_DEFENSE} from "../triggers/condition-get-defense-trigger.js";
import {ConditionGetTraitsTrigger, TRIGGER_CONDITION_GET_TRAITS} from "../triggers/condition-get-traits-trigger.js";
import {ThisAttackTrigger, TRIGGER_THIS_ATTACK} from "../triggers/this-attack-trigger.js";
import {ThisDefeatMinionTrigger, TRIGGER_THIS_DEFEAT_MINION} from "../triggers/this-defeat-minion-trigger.js";
import {ThisEnterPlayTrigger, TRIGGER_THIS_ENTER_PLAY} from "../triggers/this-enter-play-trigger.js";
import {ThisGetThwartTrigger, TRIGGER_THIS_GET_THWART} from "../triggers/this-get-thwart-trigger.js";
import {ThisEndPlayCardTrigger, TRIGGER_THIS_END_PLAY_CARD} from "../triggers/this-end-play-card-trigger.js";
import {ThisThwartsTrigger, TRIGGER_THIS_THWARTS} from "../triggers/this-thwarts-trigger.js";
import {TRIGGER_VILLAIN_ATTACKS, VillainAttacksTrigger} from "../triggers/villain-attacks-trigger.js";
import {TRIGGER_VILLAIN_ATTACKS_YOU, VillainAttacksYouTrigger} from "../triggers/villain-attacks-you-trigger.js";
import {TRIGGER_VILLAIN_SCHEMES, VillainSchemesTrigger} from "../triggers/villain-schemes-trigger.js";
import {TRIGGER_YOU_ATTACK, YouAttackTrigger} from "../triggers/you-attack-trigger.js";
import {TRIGGER_YOU_ANY_ATTACK, YouAnyAttackTrigger} from "../triggers/you-any-attack-trigger.js";
import {TRIGGER_YOU_DEFEAT_MINION, YouDefeatMinionTrigger} from "../triggers/you-defeat-minion-trigger.js";
import {TRIGGER_YOU_WOULD_TAKE_DAMAGE, YouWouldTakeDamageTrigger} from "../triggers/you-would-take-damage-trigger.js";
import {
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
    YourHeroAttackDefeatEnemyTrigger
} from "../triggers/your-hero-attack-defeat-enemy-trigger.js";
import {TRIGGER_YOUR_HERO_GET_ATTACK, YourHeroGetAttackTrigger} from "../triggers/your-hero-get-attack-trigger.js";
import {TRIGGER_YOUR_HERO_GET_THWART, YourHeroGetThwartTrigger} from "../triggers/your-hero-get-thwart-trigger.js";
import {EndPlayCardTrigger, TRIGGER_END_PLAY_CARD} from "../triggers/end-play-card-trigger.js";
import {InstantTrigger, TRIGGER_INSTANT} from "../triggers/instant-trigger.js";
import {PhaseEndsTrigger, TRIGGER_PHASE_ENDS} from "../triggers/phase-ends-trigger.js";
import {PlaceThreatTrigger, TRIGGER_PLACE_THREAT} from "../triggers/place-threat-trigger.js";
import {PlayCardTrigger, TRIGGER_PLAY_CARD} from "../triggers/play-card-trigger.js";
import {TreacheryRevealTrigger, TRIGGER_TREACHERY_REVEAL} from "../triggers/treachery-reveal-trigger.js";
import {EngageHeroTrigger, TRIGGER_ENGAGE_HERO} from "../triggers/engage-hero-trigger.js";

export class TriggersFactory {
    constructor(match) {
        this.match = match;
    }
    _createTriggerParams({card, type, ability, triggerParams}) {
        return {
            trigger: type,
            card,
            ability,
            ...triggerParams,
        };
    }
    createTrigger(params) {
        const {type} = params;
        const triggerParams = this._createTriggerParams(params);

        switch (type) {
            case TRIGGER_ATTACHED_DEFEAT:
                return new AttachedDefeatTrigger(triggerParams);
            case TRIGGER_ATTACHED_WOULD_ATTACK:
                return new AttachedWouldAttackTrigger(triggerParams);
            case TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE:
                return new AttachedWouldDealtDamageTrigger(triggerParams);
            case TRIGGER_CONDITION_GET_DEFENSE:
                return new ConditionGetDefenseTrigger(triggerParams);
            case TRIGGER_CONDITION_GET_TRAITS:
                return new ConditionGetTraitsTrigger(triggerParams);
            case TRIGGER_THIS_ATTACK:
                return new ThisAttackTrigger(triggerParams);
            case TRIGGER_THIS_DEFEAT_MINION:
                return new ThisDefeatMinionTrigger(triggerParams);
            case TRIGGER_THIS_ENTER_PLAY:
                return new ThisEnterPlayTrigger(triggerParams);
            case TRIGGER_THIS_GET_THWART:
                return new ThisGetThwartTrigger(triggerParams);
            case TRIGGER_THIS_END_PLAY_CARD:
                return new ThisEndPlayCardTrigger(triggerParams);
            case TRIGGER_THIS_THWARTS:
                return new ThisThwartsTrigger(triggerParams);
            case TRIGGER_VILLAIN_ATTACKS:
                return new VillainAttacksTrigger(triggerParams);
            case TRIGGER_VILLAIN_ATTACKS_YOU:
                return new VillainAttacksYouTrigger(triggerParams);
            case TRIGGER_VILLAIN_SCHEMES:
                return new VillainSchemesTrigger(triggerParams);
            case TRIGGER_YOU_ATTACK:
                return new YouAttackTrigger(triggerParams);
            case TRIGGER_YOU_ANY_ATTACK:
                return new YouAnyAttackTrigger(triggerParams);
            case TRIGGER_YOU_DEFEAT_MINION:
                return new YouDefeatMinionTrigger(triggerParams);
            case TRIGGER_YOU_WOULD_TAKE_DAMAGE:
                return new YouWouldTakeDamageTrigger(triggerParams);
            case TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY:
                return new YourHeroAttackDefeatEnemyTrigger(triggerParams);
            case TRIGGER_YOUR_HERO_GET_ATTACK:
                return new YourHeroGetAttackTrigger(triggerParams);
            case TRIGGER_YOUR_HERO_GET_THWART:
                return new YourHeroGetThwartTrigger(triggerParams);
            case TRIGGER_END_PLAY_CARD:
                return new EndPlayCardTrigger(triggerParams);
            case TRIGGER_INSTANT:
                return new InstantTrigger(triggerParams);
            case TRIGGER_PHASE_ENDS:
                return new PhaseEndsTrigger(triggerParams);
            case TRIGGER_PLACE_THREAT:
                return new PlaceThreatTrigger(triggerParams);
            case TRIGGER_PLAY_CARD:
                return new PlayCardTrigger(triggerParams);
            case TRIGGER_TREACHERY_REVEAL:
                return new TreacheryRevealTrigger(triggerParams);
            case TRIGGER_ENGAGE_HERO:
                return new EngageHeroTrigger(triggerParams);
            default:
                return new Trigger(triggerParams);
        }
    }
}

