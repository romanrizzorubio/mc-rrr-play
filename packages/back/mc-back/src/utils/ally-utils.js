export const getAlliesCountingTowardLimit = allies =>
    allies.filter(ally => ally.countsTowardAllyLimit !== false);
