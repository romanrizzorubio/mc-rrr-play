import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {createConnection} from 'node:net';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2] || 'docker';
if (!['local', 'docker'].includes(mode)) {
    throw new Error(`Unknown startup mode "${mode}". Use "local" or "docker".`);
}

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const mongoUrl = new URL(mongoUri);

if (!['mongodb:', 'mongodb+srv:'].includes(mongoUrl.protocol)) {
    throw new Error('MONGODB_URI must use mongodb:// or mongodb+srv://');
}

const mongoHost = mongoUrl.hostname.replace(/^\[|\]$/g, '');
const mongoPort = Number(mongoUrl.port || 27017);
const mongoDataPath = resolve(projectRoot, process.env.MONGODB_DB_PATH || '.local/mongodb');
const localMongoHosts = new Set(['localhost', '127.0.0.1', '::1']);
const connectionErrors = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ETIMEDOUT',
]);
const children = new Map();
let mongoContainerStarted = false;
let stopRequested = false;
let exitCode = 0;
let resolveStop;

const stopped = new Promise(resolve => {
    resolveStop = resolve;
});

const requestStop = code => {
    if (stopRequested) {
        return;
    }
    stopRequested = true;
    exitCode = code;
    resolveStop();
};

process.on('SIGINT', () => requestStop(0));
process.on('SIGTERM', () => requestStop(0));

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const canConnectToMongo = (host, port) => new Promise((resolve, reject) => {
    const socket = createConnection({host, port});
    const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
    }, 750);

    socket.once('connect', () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(true);
    });
    socket.once('error', error => {
        clearTimeout(timeout);
        if (connectionErrors.has(error.code)) {
            resolve(false);
            return;
        }
        reject(error);
    });
});

const runNpmScript = scriptName => new Promise((resolve, reject) => {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npmCommand, ['run', scriptName], {
        cwd: projectRoot,
        shell: process.platform === 'win32',
        stdio: 'inherit',
    });

    child.once('error', error => reject(new Error(
        `Could not run npm script "${scriptName}": ${error.message}`,
        {cause: error},
    )));
    child.once('close', (code, signal) => {
        if (code === 0 || stopRequested) {
            resolve();
            return;
        }
        const composeHint = scriptName === 'mongo:up' ?
            '; verify that Docker Compose is installed and the Docker daemon is running' : '';
        reject(new Error(`npm run ${scriptName} exited with ${signal || code}${composeHint}`));
    });
});

const signalChild = (child, state, signal) => {
    if (state.processGroup && process.platform !== 'win32' && child.pid) {
        try {
            process.kill(-child.pid, signal);
        } catch (error) {
            if (error.code !== 'ESRCH') {
                throw error;
            }
        }
        return;
    }
    if (child.exitCode !== null || child.signalCode !== null) {
        return;
    }
    child.kill(signal);
};

const startChild = (command, args, {name, processGroup = false}) => {
    const detached = processGroup && process.platform !== 'win32';
    const child = spawn(command, args, {
        cwd: projectRoot,
        detached,
        shell: process.platform === 'win32' && command.endsWith('.cmd'),
        stdio: 'inherit',
    });
    const state = {name, processGroup: detached};

    children.set(child, state);
    child.once('error', error => {
        if (name === 'Local MongoDB') {
            console.error(
                `Could not start "${process.env.MONGOD_BIN || 'mongod'}": ${error.message}. ` +
                'Install MongoDB Community Server or set MONGOD_BIN to its executable.',
            );
        } else {
            console.error(`Could not start ${name}: ${error.message}`);
        }
        requestStop(1);
    });
    child.once('exit', (code, signal) => {
        signalChild(child, state, 'SIGTERM');
        children.delete(child);
        if (stopRequested) {
            return;
        }

        console.error(`${name} exited unexpectedly (${signal || code})`);
        requestStop(code === 0 ? 1 : code ?? 1);
    });

    return child;
};

const waitForMongo = async child => {
    const deadline = Date.now() + 30_000;

    while (!stopRequested && Date.now() < deadline) {
        if (child && (child.exitCode !== null || child.signalCode !== null)) {
            throw new Error(`Local mongod exited before MongoDB became available at ${mongoHost}:${mongoPort}`);
        }
        if (await canConnectToMongo(mongoHost, mongoPort)) {
            console.log(`MongoDB is ready at ${mongoHost}:${mongoPort}`);
            return;
        }
        await delay(250);
    }

    if (!stopRequested) {
        throw new Error(`Timed out waiting for MongoDB at ${mongoHost}:${mongoPort}`);
    }
};

const startLocalMongo = async () => {
    if (!localMongoHosts.has(mongoHost)) {
        throw new Error('Local mode requires MONGODB_URI to point to localhost.');
    }
    if (mongoUrl.protocol === 'mongodb+srv:') {
        throw new Error('Local mode requires a mongodb:// URI, not mongodb+srv://.');
    }
    if (await canConnectToMongo(mongoHost, mongoPort)) {
        console.log(`MongoDB is already listening at ${mongoHost}:${mongoPort}; reusing it.`);
        return;
    }
    if (stopRequested) {
        return;
    }

    await mkdir(mongoDataPath, {recursive: true});
    console.log(`Starting local MongoDB with data in ${mongoDataPath}`);

    const child = startChild(process.env.MONGOD_BIN || 'mongod', [
        '--dbpath',
        mongoDataPath,
        '--bind_ip',
        mongoHost,
        '--port',
        String(mongoPort),
    ], {name: 'Local MongoDB'});
    await waitForMongo(child);
};

const startDockerMongo = async () => {
    if (!localMongoHosts.has(mongoHost)) {
        console.log('MONGODB_URI points to an external host; skipping the local MongoDB container.');
        return;
    }
    if (mongoUrl.protocol === 'mongodb+srv:') {
        throw new Error('Use mongodb:// for the local MongoDB container.');
    }
    if (mongoPort !== 27017) {
        throw new Error('The local MongoDB container publishes port 27017; update MONGODB_URI to use that port.');
    }
    if (stopRequested) {
        return;
    }

    console.log('Starting MongoDB with Docker Compose...');
    try {
        await runNpmScript('mongo:up');
    } catch (error) {
        throw new Error(
            'Could not start MongoDB in Docker. Check Docker Compose and make sure port 27017 is free.',
            {cause: error},
        );
    }
    mongoContainerStarted = true;
    if (!stopRequested) {
        await waitForMongo();
    }
};

const startMongo = () => mode === 'local' ? startLocalMongo() : startDockerMongo();

const waitForClose = child => {
    if (child.exitCode !== null || child.signalCode !== null) {
        return Promise.resolve();
    }
    return new Promise(resolve => child.once('close', resolve));
};

const stopChildren = async () => {
    const running = [...children.entries()].reverse();
    for (const [child, state] of running) {
        signalChild(child, state, 'SIGTERM');
    }

    let timeout;
    await Promise.race([
        Promise.all(running.map(([child]) => waitForClose(child))),
        new Promise(resolve => {
            timeout = setTimeout(resolve, 5_000);
        }),
    ]);
    clearTimeout(timeout);

    for (const [child, state] of running) {
        signalChild(child, state, 'SIGKILL');
    }
    await Promise.all(running.map(([child]) => waitForClose(child)));
};

const main = async () => {
    try {
        if (!stopRequested) {
            await startMongo();
        }
        if (!stopRequested) {
            const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
            startChild(npmCommand, ['run', 'start:frontend'], {
                name: 'Frontend',
                processGroup: true,
            });
            startChild(npmCommand, ['run', 'start:backend'], {
                name: 'Backend',
                processGroup: true,
            });
            console.log('Frontend and backend started. Press Ctrl+C to stop managed processes.');
            await stopped;
        }
    } catch (error) {
        console.error(error);
        requestStop(1);
    } finally {
        if (mongoContainerStarted) {
            console.log('MongoDB container remains running; stop it with npm run mongo:down.');
        }
        await stopChildren();
        process.exitCode = exitCode;
    }
};

await main();
