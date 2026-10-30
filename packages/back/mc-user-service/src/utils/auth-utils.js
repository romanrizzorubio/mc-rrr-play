import {createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';

const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;
const scryptOptions = {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
};

export const PASSWORD_POLICY = Object.freeze({
    minLength: 10,
    maxLength: 128,
    lengthUnit: 'UTF-16 code units (JavaScript String.length)',
    requiredCharacterClasses: 3,
    characterClasses: Object.freeze([
        Object.freeze({name: 'unicodeLowercaseLetter', pattern: String.raw`\p{Ll}`}),
        Object.freeze({name: 'unicodeUppercaseLetter', pattern: String.raw`\p{Lu}`}),
        Object.freeze({name: 'unicodeNumber', pattern: String.raw`\p{N}`}),
        Object.freeze({
            name: 'nonLetterAndNonNumber',
            pattern: String.raw`[^\p{L}\p{N}]`,
        }),
    ]),
    trimsWhitespace: false,
    description:
        'Use 10–128 UTF-16 code units and meet at least 3 of these 4 classes: Unicode lowercase letter (\\p{Ll}), Unicode uppercase letter (\\p{Lu}), Unicode number (\\p{N}), or a character that is neither a Unicode letter nor a Unicode number ([^\\p{L}\\p{N}]). Passwords are not trimmed.',
    errorMessage:
        'La contraseña debe tener entre 10 y 128 unidades UTF-16 y cumplir al menos 3 de estas 4 categorías: letra minúscula Unicode, letra mayúscula Unicode, número Unicode o carácter que no sea letra ni número. No se eliminan espacios.',
});

export const createServiceError = (message, statusCode) =>
    Object.assign(new Error(message), {statusCode});

export const normalizeEmail = email => email.trim().toLowerCase();

export const validateEmail = email => {
    if (typeof email !== 'string') {
        throw createServiceError('Indica una dirección de correo válida.', 400);
    }

    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalizedEmail)) {
        throw createServiceError('Indica una dirección de correo válida.', 400);
    }

    return normalizedEmail;
};

export const validateDisplayName = displayName => {
    if (typeof displayName !== 'string') {
        throw createServiceError('El nombre debe tener entre 1 y 80 caracteres.', 400);
    }

    const normalizedName = displayName.trim();
    const length = [...normalizedName].length;
    if (length < 1 || length > 80) {
        throw createServiceError('El nombre debe tener entre 1 y 80 caracteres.', 400);
    }

    return normalizedName;
};

export const validatePassword = password => {
    if (typeof password !== 'string' ||
        password.length < PASSWORD_POLICY.minLength ||
        password.length > PASSWORD_POLICY.maxLength) {
        throw createServiceError(
            PASSWORD_POLICY.errorMessage,
            400,
        );
    }

    const characterClassCount = PASSWORD_POLICY.characterClasses.filter(({pattern}) =>
        new RegExp(pattern, 'u').test(password)
    ).length;
    if (characterClassCount < PASSWORD_POLICY.requiredCharacterClasses) {
        throw createServiceError(
            PASSWORD_POLICY.errorMessage,
            400,
        );
    }

    return password;
};

export const createOpaqueToken = () => randomBytes(32).toString('base64url');

export const hashOpaqueToken = token =>
    createHash('sha256').update(token, 'utf8').digest('hex');

export const hashPassword = async password => {
    const salt = randomBytes(16).toString('hex');
    const hash = await scrypt(password, salt, passwordKeyLength, scryptOptions);

    return `scrypt$${salt}$${hash.toString('hex')}`;
};

export const verifyPassword = async (password, passwordHash) => {
    if (typeof passwordHash !== 'string') {
        return false;
    }

    const [algorithm, salt, hashHex, ...extra] = passwordHash.split('$');
    if (algorithm !== 'scrypt' ||
        !/^[\da-f]{32}$/u.test(salt || '') ||
        !/^[\da-f]{128}$/u.test(hashHex || '') ||
        extra.length > 0) {
        return false;
    }

    const expectedHash = Buffer.from(hashHex, 'hex');
    const actualHash = await scrypt(password, salt, passwordKeyLength, scryptOptions);

    return timingSafeEqual(actualHash, expectedHash);
};

export const readCookie = (request, cookieName) => {
    const cookieHeader = request.headers.cookie;
    if (typeof cookieHeader !== 'string') {
        return null;
    }

    for (const cookie of cookieHeader.split(';')) {
        const separator = cookie.indexOf('=');
        if (separator < 0 || cookie.slice(0, separator).trim() !== cookieName) {
            continue;
        }

        try {
            return decodeURIComponent(cookie.slice(separator + 1).trim()) || null;
        } catch {
            return null;
        }
    }

    return null;
};
