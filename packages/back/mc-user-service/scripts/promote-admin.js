import {MongoUserStore} from '../src/user-store.js';
import {validateEmail} from '../src/utils/auth-utils.js';

const emailNormalized = validateEmail(process.argv[2]);
const store = new MongoUserStore();

await store.connect();
try {
    const promoted = await store.promoteAdminByEmail({
        emailNormalized,
        now: new Date(),
    });
    if (!promoted) {
        throw new Error('No existe una cuenta activa con ese email.');
    }
    console.log('La cuenta existente se ha marcado como administradora.');
} finally {
    await store.close();
}
