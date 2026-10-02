import {
    EFFECT_ADD_ACCELERATION_TOKEN,
    EFFECT_ADD_TRAIT,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CANCEL_ATTACK,
    EFFECT_CANCEL_ENCOUNTER,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_CHOOSE,
    EFFECT_CONFUSE,
    EFFECT_DEAL_BOOST,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DEFEAT,
    EFFECT_DELAYED,
    EFFECT_DISCARD_CONDITION_HAND,
    EFFECT_DISCARD_DRAW,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_HAND,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DISCARD_REVEAL,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_DAMAGE,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_DO_IF_HAS_TRAITS,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_EXHAUST,
    EFFECT_FACEDOWN,
    EFFECT_FILL_HAND,
    EFFECT_FLIP,
    EFFECT_GENERATE_RESOURCES_FROM_CARD,
    EFFECT_HEAL,
    EFFECT_INCLUDE_ASIDE_CARDS,
    EFFECT_LASTING,
    EFFECT_MAY,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_HAND_SIZE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MODIFY_MAX_ALLIES,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_MODIFY_TRAITS,
    EFFECT_MOVE_DAMAGE,
    EFFECT_MOVE_TO_DECK,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PAY_PRINTED_COST,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PLACE_DAMAGE,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_PREVENT_PLACE_DAMAGE,
    EFFECT_PREVENT_PLACE_THREAT,
    EFFECT_PUT_PLAY,
    EFFECT_RANDOM_CARD,
    EFFECT_READY,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_COUNTER,
    EFFECT_REMOVE_TRAIT,
    EFFECT_REMOVE_USE,
    EFFECT_REMOVE_THREAT,
    EFFECT_RESOLVE_SELECTED_SPECIAL_ABILITIES,
    EFFECT_RETURN_FACEDOWN,
    EFFECT_RETURN_HAND,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_REVEAL_FIRST_ENCOUNTER,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SEARCH_CARDS,
    EFFECT_SELECT_AND_ORDER_CARDS,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SELECT_DISCARD_TO_CARD,
    EFFECT_SELECT_FROM_TOP_DECK,
    EFFECT_SEVERAL_ATTACKS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SPEND,
    EFFECT_SPEND_X,
    EFFECT_STUN,
    EFFECT_SURGE,
    EFFECT_TAKE_DAMAGE,
    EFFECT_TOUGH,
} from 'mc-shared';

import {AddAccelerationTokenEffect} from '../../effects/add-acceleration-token-effect.js';
import {AddTraitEffect} from '../../effects/add-trait-effect.js';
import {AssignDamageEffect} from '../../effects/assign-damage-effect.js';
import {CancelAttackEffect} from '../../effects/cancel-attack-effect.js';
import {CancelEncounterEffect} from '../../effects/cancel-encounter-effect.js';
import {ChainedEffect} from '../../effects/chained-effect.js';
import {ChooseAbilityEffect} from '../../effects/choose-ability-effect.js';
import {ChooseEffect} from '../../effects/choose-effect.js';
import {ConfuseEffect} from '../../effects/confuse-effect.js';
import {DealBoostEffect} from '../../effects/deal-boost-effect.js';
import {DealDamageEffect} from '../../effects/deal-damage-effect.js';
import {DefeatEffect} from '../../effects/defeat-effect.js';
import {DelayedEffect} from '../../effects/delayed-effect.js';
import {DiscardConditionHandEffect} from '../../effects/discard-condition-hand-effect.js';
import {DiscardDrawEffect} from '../../effects/discard-draw-effect.js';
import {DiscardFromDeckEffect} from '../../effects/discard-from-deck-effect.js';
import {DiscardFromGameEffect} from '../../effects/discard-from-game-effect.js';
import {DiscardFromHandEffect} from '../../effects/discard-from-hand-effect.js';
import {DiscardRandomEffect} from '../../effects/discard-random-effect.js';
import {DiscardRevealEffect} from '../../effects/discard-reveal-effect.js';
import {DoIfCardGameEffect} from '../../effects/do-if-card-game-effect.js';
import {DoIfEffect} from '../../effects/do-if-effect.js';
import {DoIfHasDamageEffect} from '../../effects/do-if-has-damage-effect.js';
import {DoIfHasPaidEffect} from '../../effects/do-if-has-paid-effect.js';
import {DoIfHasTraitsEffect} from '../../effects/do-if-has-traits-effect.js';
import {DoIfTakeCharacterDamageEffect} from '../../effects/do-if-take-character-damage-effect.js';
import {DrawEffect} from '../../effects/draw-effect.js';
import {EnemyAttackEffect} from '../../effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../effects/enemy-scheme-effect.js';
import {ExhaustEffect} from '../../effects/exhaust-effect.js';
import {FaceDownEffect} from '../../effects/facedown-effect.js';
import {FillHandEffect} from '../../effects/fill-hand-effect.js';
import {FlipEffect} from '../../effects/flip-effect.js';
import {GenerateResourcesFromCardEffect} from '../../effects/generate-resources-from-card-effect.js';
import {HealEffect} from '../../effects/heal-effect.js';
import {IncludeAsideCardsEffect} from '../../effects/include-aside-cards-effect.js';
import {LastingEffect} from '../../effects/lasting-effect.js';
import {MayEffect} from '../../effects/may-effect.js';
import {ModifyAttackEffect} from '../../effects/modify-attack-effect.js';
import {ModifyAttackValueEffect} from '../../effects/modify-attack-value-effect.js';
import {ModifyCostEffect} from '../../effects/modify-cost-effect.js';
import {ModifyDefenseValueEffect} from '../../effects/modify-defense-value-effect.js';
import {ModifyHandSizeEffect} from '../../effects/modify-hand-size-effect.js';
import {ModifyHitPointsEffect} from '../../effects/modify-hit-points-effect.js';
import {ModifyMaxAlliesEffect} from '../../effects/modify-max-allies-effect.js';
import {ModifyThwartValueEffect} from '../../effects/modify-thwart-value-effect.js';
import {ModifyTraitsEffect} from '../../effects/modify-traits-effect.js';
import {MoveDamageEffect} from '../../effects/move-damage-effect.js';
import {MoveToDeckEffect} from '../../effects/move-to-deck-effect.js';
import {MoveToHandEffect} from '../../effects/move-to-hand-effect.js';
import {PayPrintedCostEffect} from '../../effects/pay-printed-cost-effect.js';
import {PlaceCountersEffect} from '../../effects/place-counters-effect.js';
import {PlaceDamageEffect} from '../../effects/place-damage-effect.js';
import {PlaceThreatEffect} from '../../effects/place-threat-effect.js';
import {PreventDamageEffect} from '../../effects/prevent-damage-effect.js';
import {PreventPlaceDamageEffect} from '../../effects/prevent-place-damage-effect.js';
import {PreventPlaceThreatEffect} from '../../effects/prevent-place-threat-effect.js';
import {PutPlayEffect} from '../../effects/put-play-effect.js';
import {RandomCardEffect} from '../../effects/random-card-effect.js';
import {ReadyEffect} from '../../effects/ready-effect.js';
import {RemoveCardEffect} from '../../effects/remove-card-effect.js';
import {RemoveCountersEffect} from '../../effects/remove-counters-effect.js';
import {RemoveTraitEffect} from '../../effects/remove-trait-effect.js';
import {RemoveThreatEffect} from '../../effects/remove-threat-effect.js';
import {ResolveSelectedSpecialAbilitiesEffect} from '../../effects/resolve-selected-special-abilities-effect.js';
import {ReturnFaceDownEffect} from '../../effects/return-facedown-effect.js';
import {ReturnHandEffect} from '../../effects/return-hand-effect.js';
import {RevealEncounterEffect} from '../../effects/reveal-encounter-effect.js';
import {RevealFirstEncounterEffect} from '../../effects/reveal-first-encounter-effect.js';
import {SearchCardAndRevealEffect} from '../../effects/search-card-reveal-effect.js';
import {SearchCardsEffect} from '../../effects/search-cards-effect.js';
import {SelectAndOrderCardsEffect} from '../../effects/select-and-order-cards-effect.js';
import {SelectDiscardCardEffect} from '../../effects/select-discard-card-effect.js';
import {SelectFromTopDeckEffect} from '../../effects/select-from-top-deck-effect.js';
import {SeveralAttacksEffect} from '../../effects/several-attacks-effect.js';
import {ShuffleDeckEffect} from '../../effects/shuffle-deck-effect.js';
import {SpendEffect} from '../../effects/spend-effect.js';
import {SpendXEffect} from '../../effects/spend-x-effect.js';
import {StunEffect} from '../../effects/stun-effect.js';
import {SurgeEffect} from '../../effects/surge-effect.js';
import {TakeDamageEffect} from '../../effects/take-damage-effect.js';
import {ToughEffect} from '../../effects/tough-effect.js';
import {SelectDiscardToCardEffect} from '../../effects/select-discard-to-card-effect.js';

export const EFFECT_MAP = {
    [EFFECT_ADD_ACCELERATION_TOKEN]: AddAccelerationTokenEffect,
    [EFFECT_ADD_TRAIT]: AddTraitEffect,
    [EFFECT_ASSIGN_DAMAGE]: AssignDamageEffect,
    [EFFECT_PREVENT_DAMAGE]: PreventDamageEffect,
    [EFFECT_PREVENT_PLACE_DAMAGE]: PreventPlaceDamageEffect,
    [EFFECT_PREVENT_PLACE_THREAT]: PreventPlaceThreatEffect,
    [EFFECT_CANCEL_ATTACK]: CancelAttackEffect,
    [EFFECT_CANCEL_ENCOUNTER]: CancelEncounterEffect,
    [EFFECT_CHAINED]: ChainedEffect,
    [EFFECT_CHOOSE]: ChooseEffect,
    [EFFECT_CHOOSE_ABILITY]: ChooseAbilityEffect,
    [EFFECT_CONFUSE]: ConfuseEffect,
    [EFFECT_DEAL_BOOST]: DealBoostEffect,
    [EFFECT_DEAL_DAMAGE]: DealDamageEffect,
    [EFFECT_DEFEAT]: DefeatEffect,
    [EFFECT_DISCARD_FROM_DECK]: DiscardFromDeckEffect,
    [EFFECT_DISCARD_DRAW]: DiscardDrawEffect,
    [EFFECT_DISCARD_GAME]: DiscardFromGameEffect,
    [EFFECT_DISCARD_HAND]: DiscardFromHandEffect,
    [EFFECT_DISCARD_CONDITION_HAND]: DiscardConditionHandEffect,
    [EFFECT_DISCARD_RANDOM]: DiscardRandomEffect,
    [EFFECT_DISCARD_REVEAL]: DiscardRevealEffect,
    [EFFECT_DO_IF]: DoIfEffect,
    [EFFECT_DO_IF_CARD_GAME]: DoIfCardGameEffect,
    [EFFECT_DO_IF_HAS_DAMAGE]: DoIfHasDamageEffect,
    [EFFECT_DO_IF_HAS_PAID]: DoIfHasPaidEffect,
    [EFFECT_DO_IF_HAS_TRAITS]: DoIfHasTraitsEffect,
    [EFFECT_DO_IF_TAKE_DAMAGE]: DoIfTakeCharacterDamageEffect,
    [EFFECT_DRAW_CARD]: DrawEffect,
    [EFFECT_ENEMY_ATTACK]: EnemyAttackEffect,
    [EFFECT_EXHAUST]: ExhaustEffect,
    [EFFECT_FACEDOWN]: FaceDownEffect,
    [EFFECT_FLIP]: FlipEffect,
    [EFFECT_HEAL]: HealEffect,
    [EFFECT_INCLUDE_ASIDE_CARDS]: IncludeAsideCardsEffect,
    [EFFECT_DELAYED]: DelayedEffect,
    [EFFECT_LASTING]: LastingEffect,
    [EFFECT_MAY]: MayEffect,
    [EFFECT_MODIFY_ATTACK]: ModifyAttackEffect,
    [EFFECT_MODIFY_ATTACK_VALUE]: ModifyAttackValueEffect,
    [EFFECT_MODIFY_MAX_ALLIES]: ModifyMaxAlliesEffect,
    [EFFECT_MODIFY_COST]: ModifyCostEffect,
    [EFFECT_MODIFY_DEFENSE_VALUE]: ModifyDefenseValueEffect,
    [EFFECT_MODIFY_HAND_SIZE]: ModifyHandSizeEffect,
    [EFFECT_MODIFY_THWART_VALUE]: ModifyThwartValueEffect,
    [EFFECT_MODIFY_HIT_POINTS]: ModifyHitPointsEffect,
    [EFFECT_MODIFY_TRAITS]: ModifyTraitsEffect,
    [EFFECT_MOVE_DAMAGE]: MoveDamageEffect,
    [EFFECT_PLACE_COUNTERS]: PlaceCountersEffect,
    [EFFECT_PLACE_DAMAGE]: PlaceDamageEffect,
    [EFFECT_PLACE_THREAT]: PlaceThreatEffect,
    [EFFECT_RANDOM_CARD]: RandomCardEffect,
    [EFFECT_READY]: ReadyEffect,
    [EFFECT_SELECT_AND_ORDER_CARDS]: SelectAndOrderCardsEffect,
    [EFFECT_RESOLVE_SELECTED_SPECIAL_ABILITIES]: ResolveSelectedSpecialAbilitiesEffect,
    [EFFECT_REMOVE_CARD]: RemoveCardEffect,
    [EFFECT_RETURN_HAND]: ReturnHandEffect,
    [EFFECT_REVEAL_ENCOUNTER]: RevealEncounterEffect,
    [EFFECT_REMOVE_THREAT]: RemoveThreatEffect,
    [EFFECT_REMOVE_COUNTER]: RemoveCountersEffect,
    [EFFECT_REMOVE_TRAIT]: RemoveTraitEffect,
    [EFFECT_REMOVE_USE]: RemoveCountersEffect,
    [EFFECT_RETURN_FACEDOWN]: ReturnFaceDownEffect,
    [EFFECT_REVEAL_FIRST_ENCOUNTER]: RevealFirstEncounterEffect,
    [EFFECT_ENEMY_SCHEME]: EnemySchemeEffect,
    [EFFECT_PUT_PLAY]: PutPlayEffect,
    [EFFECT_SEARCH_CARDS]: SearchCardsEffect,
    [EFFECT_SHUFFLE_DECK]: ShuffleDeckEffect,
    [EFFECT_MOVE_TO_HAND]: MoveToHandEffect,
    [EFFECT_MOVE_TO_DECK]: MoveToDeckEffect,
    [EFFECT_PAY_PRINTED_COST]: PayPrintedCostEffect,
    [EFFECT_FILL_HAND]: FillHandEffect,
    [EFFECT_GENERATE_RESOURCES_FROM_CARD]: GenerateResourcesFromCardEffect,
    [EFFECT_SEARCH_CARD_REVEAL]: SearchCardAndRevealEffect,
    [EFFECT_SELECT_DISCARD_CARD]: SelectDiscardCardEffect,
    [EFFECT_SELECT_DISCARD_TO_CARD]: SelectDiscardToCardEffect,
    [EFFECT_SELECT_FROM_TOP_DECK]: SelectFromTopDeckEffect,
    [EFFECT_SEVERAL_ATTACKS]: SeveralAttacksEffect,
    [EFFECT_SPEND]: SpendEffect,
    [EFFECT_SPEND_X]: SpendXEffect,
    [EFFECT_SURGE]: SurgeEffect,
    [EFFECT_STUN]: StunEffect,
    [EFFECT_TAKE_DAMAGE]: TakeDamageEffect,
    [EFFECT_TOUGH]: ToughEffect,
};
