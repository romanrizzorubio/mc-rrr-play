export const seedCatalog = async (database, catalog) => {
    for (const [collectionName, records] of Object.entries(catalog)) {
        const collection = database.collection(collectionName);
        await Promise.all(records.map(({_id, ...document}) => collection.replaceOne(
            {_id},
            {_id, ...document},
            {upsert: true},
        )));
    }

    await database.collection('scenarios').deleteOne({_id: 'rino2'});
};
