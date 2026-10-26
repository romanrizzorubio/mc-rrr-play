export const getClassifications = classification => {
    if (Array.isArray(classification)) {
        return classification;
    }

    return typeof classification === 'string' ? [classification] : [];
};

export const hasClassification = (classification, expected) =>
    getClassifications(classification).includes(expected);
