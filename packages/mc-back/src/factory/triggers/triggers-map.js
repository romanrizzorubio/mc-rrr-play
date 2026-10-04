import {
    TRIGGER_ATTACHED_DEFEAT,
    TRIGGER_ATTACHED_GET_ATTACK,
    TRIGGER_ATTACHED_GET_THWART,
    TRIGGER_ATTACHED_WOULD_ATTACK,
    TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
    TRIGGER_CONDITION_GET_DEFENSE,
    TRIGGER_CONDITION_GET_TRAITS,
    TRIGGER_END_PLAY_CARD,
    TRIGGER_ENCOUNTER_REVEAL,
    TRIGGER_ENGAGE_HERO,
    TRIGGER_INSTANT,
    TRIGGER_MINION_ENTER_PLAY,
    TRIGGER_PHASE_ENDS,
    TRIGGER_PLACE_THREAT,
    TRIGGER_PLAY_CARD,
    TRIGGER_ROUND_ENDS,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT_MINION,
    TRIGGER_THIS_END_PLAY_CARD,
    TRIGGER_THIS_ENTER_PLAY,
    TRIGGER_THIS_GET_THWART,
    TRIGGER_THIS_SCHEME,
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
    TRIGGER_WOULD_PLACE_THREAT,
    TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOUR_HERO_GET_DEFENSE,
    TRIGGER_YOUR_HERO_GET_HAND_SIZE,
    TRIGGER_YOUR_HERO_GET_HIT_POINTS,
    TRIGGER_YOUR_HERO_GET_THWART,
    TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES
} from 'mc-shared';
import {AttachedDefeatTrigger} from '../../triggers/attached-defeat-trigger.js';
import {AttachedGetStatTrigger} from '../../triggers/attached-get-stat-trigger.js';
import {AttachedWouldAttackTrigger} from '../../triggers/attached-would-attack-trigger.js';
import {
    AttachedWouldDealtDamageTrigger
} from '../../triggers/attached-would-dealt-damage-trigger.js';
import {ConditionGetDefenseTrigger} from '../../triggers/condition-get-defense-trigger.js';
import {ConditionGetTraitsTrigger} from '../../triggers/condition-get-traits-trigger.js';
import {EndPlayCardTrigger} from '../../triggers/end-play-card-trigger.js';
import {EncounterRevealTrigger} from '../../triggers/encounter-reveal-trigger.js';
import {EngageHeroTrigger} from '../../triggers/engage-hero-trigger.js';
import {InstantTrigger} from '../../triggers/instant-trigger.js';
import {MinionEnterPlayTrigger} from '../../triggers/minion-enter-play-trigger.js';
import {PhaseEndsTrigger} from '../../triggers/phase-ends-trigger.js';
import {RoundEndsTrigger} from '../../triggers/round-ends-trigger.js';
import {PlaceThreatTrigger} from '../../triggers/place-threat-trigger.js';
import {PlayCardTrigger} from '../../triggers/play-card-trigger.js';
import {ThisAttackTrigger} from '../../triggers/this-attack-trigger.js';
import {ThisDefeatMinionTrigger} from '../../triggers/this-defeat-minion-trigger.js';
import {ThisEndPlayCardTrigger} from '../../triggers/this-end-play-card-trigger.js';
import {ThisEnterPlayTrigger} from '../../triggers/this-enter-play-trigger.js';
import {ThisGetThwartTrigger} from '../../triggers/this-get-thwart-trigger.js';
import {ThisSchemeTrigger} from '../../triggers/this-scheme-trigger.js';
import {ThisThwartsTrigger} from '../../triggers/this-thwarts-trigger.js';
import {TreacheryRevealTrigger} from '../../triggers/treachery-reveal-trigger.js';
import {VillainAttacksTrigger} from '../../triggers/villain-attacks-trigger.js';
import {VillainAttacksYouTrigger} from '../../triggers/villain-attacks-you-trigger.js';
import {VillainSchemesTrigger} from '../../triggers/villain-schemes-trigger.js';
import {WouldPlaceThreatTrigger} from '../../triggers/would-place-threat-trigger.js';
import {YouAnyAttackTrigger} from '../../triggers/you-any-attack-trigger.js';
import {YouAnyThwartTrigger} from '../../triggers/you-any-thwart-trigger.js';
import {YouAttackTrigger} from '../../triggers/you-attack-trigger.js';
import {YouBasicAttackTrigger} from '../../triggers/you-basic-attack-trigger.js';
import {YouBasicThwartTrigger} from '../../triggers/you-basic-thwart-trigger.js';
import {YouDefeatMinionTrigger} from '../../triggers/you-defeat-minion-trigger.js';
import {YouWouldTakeDamageTrigger} from '../../triggers/you-would-take-damage-trigger.js';
import {
    YourHeroAttackDefeatEnemyTrigger
} from '../../triggers/your-hero-attack-defeat-enemy-trigger.js';
import {YourHeroGetAttackTrigger} from '../../triggers/your-hero-get-attack-trigger.js';
import {YourHeroGetDefenseTrigger} from '../../triggers/your-hero-get-defense-trigger.js';
import {
    YourHeroGetHandSizeTrigger
} from '../../triggers/your-hero-get-hand-size-trigger.js';
import {
    YourHeroGetHitPointsTrigger
} from '../../triggers/your-hero-get-hit-points-trigger.js';
import {YourHeroGetThwartTrigger} from '../../triggers/your-hero-get-thwart-trigger.js';
import {
    YourPlayerGetMaxAlliesTrigger
} from '../../triggers/your-player-get-max-allies-trigger.js';

export const TRIGGER_MAP = {
    [TRIGGER_ATTACHED_DEFEAT]: AttachedDefeatTrigger,
    [TRIGGER_ATTACHED_GET_ATTACK]: AttachedGetStatTrigger,
    [TRIGGER_ATTACHED_GET_THWART]: AttachedGetStatTrigger,
    [TRIGGER_ATTACHED_WOULD_ATTACK]: AttachedWouldAttackTrigger,
    [TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE]: AttachedWouldDealtDamageTrigger,
    [TRIGGER_CONDITION_GET_DEFENSE]: ConditionGetDefenseTrigger,
    [TRIGGER_CONDITION_GET_TRAITS]: ConditionGetTraitsTrigger,
    [TRIGGER_THIS_ATTACK]: ThisAttackTrigger,
    [TRIGGER_THIS_DEFEAT_MINION]: ThisDefeatMinionTrigger,
    [TRIGGER_THIS_ENTER_PLAY]: ThisEnterPlayTrigger,
    [TRIGGER_THIS_GET_THWART]: ThisGetThwartTrigger,
    [TRIGGER_THIS_SCHEME]: ThisSchemeTrigger,
    [TRIGGER_THIS_END_PLAY_CARD]: ThisEndPlayCardTrigger,
    [TRIGGER_THIS_THWARTS]: ThisThwartsTrigger,
    [TRIGGER_VILLAIN_ATTACKS]: VillainAttacksTrigger,
    [TRIGGER_VILLAIN_ATTACKS_YOU]: VillainAttacksYouTrigger,
    [TRIGGER_VILLAIN_SCHEMES]: VillainSchemesTrigger,
    [TRIGGER_YOU_ATTACK]: YouAttackTrigger,
    [TRIGGER_YOU_BASIC_ATTACK]: YouBasicAttackTrigger,
    [TRIGGER_YOU_ANY_ATTACK]: YouAnyAttackTrigger,
    [TRIGGER_YOU_ANY_THWART]: YouAnyThwartTrigger,
    [TRIGGER_YOU_BASIC_THWART]: YouBasicThwartTrigger,
    [TRIGGER_YOU_DEFEAT_MINION]: YouDefeatMinionTrigger,
    [TRIGGER_YOU_WOULD_TAKE_DAMAGE]: YouWouldTakeDamageTrigger,
    [TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY]: YourHeroAttackDefeatEnemyTrigger,
    [TRIGGER_YOUR_HERO_GET_ATTACK]: YourHeroGetAttackTrigger,
    [TRIGGER_YOUR_HERO_GET_DEFENSE]: YourHeroGetDefenseTrigger,
    [TRIGGER_YOUR_HERO_GET_HAND_SIZE]: YourHeroGetHandSizeTrigger,
    [TRIGGER_YOUR_HERO_GET_HIT_POINTS]: YourHeroGetHitPointsTrigger,
    [TRIGGER_YOUR_HERO_GET_THWART]: YourHeroGetThwartTrigger,
    [TRIGGER_YOUR_PLAYER_GET_MAX_ALLIES]: YourPlayerGetMaxAlliesTrigger,
    [TRIGGER_END_PLAY_CARD]: EndPlayCardTrigger,
    [TRIGGER_INSTANT]: InstantTrigger,
    [TRIGGER_MINION_ENTER_PLAY]: MinionEnterPlayTrigger,
    [TRIGGER_PHASE_ENDS]: PhaseEndsTrigger,
    [TRIGGER_ROUND_ENDS]: RoundEndsTrigger,
    [TRIGGER_PLACE_THREAT]: PlaceThreatTrigger,
    [TRIGGER_WOULD_PLACE_THREAT]: WouldPlaceThreatTrigger,
    [TRIGGER_PLAY_CARD]: PlayCardTrigger,
    [TRIGGER_ENCOUNTER_REVEAL]: EncounterRevealTrigger,
    [TRIGGER_TREACHERY_REVEAL]: TreacheryRevealTrigger,
    [TRIGGER_ENGAGE_HERO]: EngageHeroTrigger,
};
