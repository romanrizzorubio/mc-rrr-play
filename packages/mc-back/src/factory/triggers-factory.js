import {
    TRIGGER_ATTACHED_DEFEAT,
    TRIGGER_ATTACHED_WOULD_ATTACK,
    TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
    TRIGGER_CONDITION_GET_DEFENSE,
    TRIGGER_CONDITION_GET_TRAITS,
    TRIGGER_END_PLAY_CARD,
    TRIGGER_ENGAGE_HERO,
    TRIGGER_INSTANT,
    TRIGGER_PHASE_ENDS,
    TRIGGER_PLACE_THREAT,
    TRIGGER_PLAY_CARD,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT_MINION,
    TRIGGER_THIS_END_PLAY_CARD,
    TRIGGER_THIS_ENTER_PLAY,
    TRIGGER_THIS_GET_THWART,
    TRIGGER_THIS_THWARTS,
    TRIGGER_TREACHERY_REVEAL,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_VILLAIN_SCHEMES,
    TRIGGER_YOU_ANY_ATTACK,
    TRIGGER_YOU_ANY_THWART,
    TRIGGER_YOU_ATTACK,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_BASIC_THWART,
    TRIGGER_YOU_DEFEAT_MINION,
    TRIGGER_YOU_WOULD_TAKE_DAMAGE,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOUR_HERO_GET_HAND_SIZE,
    TRIGGER_YOUR_HERO_GET_HIT_POINTS,
    TRIGGER_YOUR_HERO_GET_THWART
} from '../constants/triggers.js';
import {AttachedDefeatTrigger} from '../triggers/attached-defeat-trigger.js';
import {AttachedWouldAttackTrigger} from '../triggers/attached-would-attack-trigger.js';
import {
    AttachedWouldDealtDamageTrigger
} from '../triggers/attached-would-dealt-damage-trigger.js';
import {Trigger} from '../triggers/base/trigger.js';
import {ConditionGetDefenseTrigger} from '../triggers/condition-get-defense-trigger.js';
import {ConditionGetTraitsTrigger} from '../triggers/condition-get-traits-trigger.js';
import {EndPlayCardTrigger} from '../triggers/end-play-card-trigger.js';
import {EngageHeroTrigger} from '../triggers/engage-hero-trigger.js';
import {InstantTrigger} from '../triggers/instant-trigger.js';
import {PhaseEndsTrigger} from '../triggers/phase-ends-trigger.js';
import {PlaceThreatTrigger} from '../triggers/place-threat-trigger.js';
import {PlayCardTrigger} from '../triggers/play-card-trigger.js';
import {ThisAttackTrigger} from '../triggers/this-attack-trigger.js';
import {ThisDefeatMinionTrigger} from '../triggers/this-defeat-minion-trigger.js';
import {ThisEndPlayCardTrigger} from '../triggers/this-end-play-card-trigger.js';
import {ThisEnterPlayTrigger} from '../triggers/this-enter-play-trigger.js';
import {ThisGetThwartTrigger} from '../triggers/this-get-thwart-trigger.js';
import {ThisThwartsTrigger} from '../triggers/this-thwarts-trigger.js';
import {TreacheryRevealTrigger} from '../triggers/treachery-reveal-trigger.js';
import {VillainAttacksTrigger} from '../triggers/villain-attacks-trigger.js';
import {VillainAttacksYouTrigger} from '../triggers/villain-attacks-you-trigger.js';
import {VillainSchemesTrigger} from '../triggers/villain-schemes-trigger.js';
import {YouAnyAttackTrigger} from '../triggers/you-any-attack-trigger.js';
import {YouAnyThwartTrigger} from '../triggers/you-any-thwart-trigger.js';
import {YouAttackTrigger} from '../triggers/you-attack-trigger.js';
import {YouBasicAttackTrigger} from '../triggers/you-basic-attack-trigger.js';
import {YouBasicThwartTrigger} from '../triggers/you-basic-thwart-trigger.js';
import {YouDefeatMinionTrigger} from '../triggers/you-defeat-minion-trigger.js';
import {YouWouldTakeDamageTrigger} from '../triggers/you-would-take-damage-trigger.js';
import {
    YourHeroAttackDefeatEnemyTrigger
} from '../triggers/your-hero-attack-defeat-enemy-trigger.js';
import {YourHeroGetAttackTrigger} from '../triggers/your-hero-get-attack-trigger.js';
import {
    YourHeroGetHandSizeTrigger
} from '../triggers/your-hero-get-hand-size-trigger.js';
import {
    YourHeroGetHitPointsTrigger
} from '../triggers/your-hero-get-hit-points-trigger.js';
import {YourHeroGetThwartTrigger} from '../triggers/your-hero-get-thwart-trigger.js';

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
            case TRIGGER_YOU_BASIC_ATTACK:
                return new YouBasicAttackTrigger(triggerParams);
            case TRIGGER_YOU_ANY_ATTACK:
                return new YouAnyAttackTrigger(triggerParams);
            case TRIGGER_YOU_ANY_THWART:
                return new YouAnyThwartTrigger(triggerParams);
            case TRIGGER_YOU_BASIC_THWART:
                return new YouBasicThwartTrigger(triggerParams);
            case TRIGGER_YOU_DEFEAT_MINION:
                return new YouDefeatMinionTrigger(triggerParams);
            case TRIGGER_YOU_WOULD_TAKE_DAMAGE:
                return new YouWouldTakeDamageTrigger(triggerParams);
            case TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY:
                return new YourHeroAttackDefeatEnemyTrigger(triggerParams);
            case TRIGGER_YOUR_HERO_GET_ATTACK:
                return new YourHeroGetAttackTrigger(triggerParams);
            case TRIGGER_YOUR_HERO_GET_HAND_SIZE:
                return new YourHeroGetHandSizeTrigger(triggerParams);
            case TRIGGER_YOUR_HERO_GET_HIT_POINTS:
                return new YourHeroGetHitPointsTrigger(triggerParams);
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

