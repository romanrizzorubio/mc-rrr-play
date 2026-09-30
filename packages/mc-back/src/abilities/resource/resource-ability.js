import {RESOURCE_WILD} from '../../constants/resources.js';
import {TARGET_ANY} from '../../constants/targets.js';
import {Ability} from '../core/ability.js';

export class ResourceAbility extends Ability {
    constructor({
// Ability
        effect: _effect, limit: _limit, maximum: _maximum, arrow: _arrow,
// ResourceAbility
        resource,
        target = TARGET_ANY,
    }) {
        super(arguments[0]);

        this.resource = resource;
        this.target = target;

        this.isResource = true;
    }
    canRun(params) {
        const {resourceType} = params;
        const {resource} = this;

        if (resourceType) {
            if (resource !== resourceType &&
                resource !== RESOURCE_WILD) {
                return false;
            }
        }

        return super.canRun(params);
    }
    toObj() {
        const {resource, target, type} = this;

        return {
            ...super.toObj(arguments[0]),
            target,
            resource,
            type,
        };
    }
}