import {Icons} from "../commons/icons.js";
import {Keywords} from "../commons/keywords.js";
import {Engine} from "../../engine/engine.js";
export const CARD_TYPE_ANY = 'any';
export class Card extends Engine {
    constructor({
// Card
        id,
        name,
        set,
        image,
        maximum,
        match,
        traits = [],
        abilities = [],
        unique = false,
        triggerInstant = false,
        icons = {},
        keywords = {},
    }) {
        super(arguments[0]);

        if (id) {
            this.id = id;
        } else {
            this.id = `${name}--${set}`.replaceAll(' ', '_').toLowerCase();
        }
        this.name = name;
        this.set = set;
        this.image = image;
        this.traits = traits;
        this.unique = unique;
        this.abilities = abilities;
        this.maximum = maximum;
        this.match = match;
        this.triggerInstant = triggerInstant;
        this.icons = new Icons(icons);
        this.keywords = new Keywords(keywords);

        this.isAttachable = false;
        this.isCharacter = false;
        this.isObligation = false;
        this.isSideScheme = false;
        this.isScheme = false;
        this.isPlayerCard = false;
        this.isEncounterCard = false;
        this.isFriendFront = false;
    }
    get accelerationIcons() {
        return this.icons.acceleration;
    }
    get amplificationIcons() {
        return this.icons.amplification;
    }
    get hasCrisis() {
        return this.icons.crisis;
    }
    get hazardIcons() {
        return this.icons.hazard;
    }
    get quickStrike() {
        return this.keywords.quickStrike;
    }
    get retaliate() {
        return this.keywords.retaliate;
    }
    get surge() {
        return this.keywords.surge;
    }
    get toughness() {
        return this.keywords.toughness;
    }
    get uses() {
        return this.keywords.uses;
    }
    toObj() {
        const {id, name, image} = this;

        return {
            id,
            name,
            image,
        }
    }
}