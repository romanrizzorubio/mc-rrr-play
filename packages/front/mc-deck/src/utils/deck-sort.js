export const compareText = (left, right) =>
    String(left ?? '').localeCompare(String(right ?? ''), 'es', {sensitivity: 'base'});

export const compareNumbers = (left, right) => Number(left ?? 0) - Number(right ?? 0);
