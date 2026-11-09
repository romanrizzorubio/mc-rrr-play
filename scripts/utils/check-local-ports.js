import {spawnSync} from 'node:child_process';

export const assertLocalPortsAvailable = async ports => {
    if (ports.some(port => !Number.isInteger(port) || port < 1 || port > 65535)) {
        throw new Error('Local service ports must be integers between 1 and 65535.');
    }

    const printManualInstructions = port => {
        console.error(`Para liberar el puerto ${port}:`);
        if (process.platform === 'win32') {
            console.error(`  netstat -ano -p tcp | findstr :${port}`);
            console.error('  taskkill /PID <PID> /T /F');
        } else if (process.platform === 'darwin') {
            console.error(`  lsof -nP -iTCP:${port} -sTCP:LISTEN`);
            console.error('  kill <PID>  (si no se libera: kill -9 <PID>)');
        } else {
            console.error(`  ss -lptn 'sport = :${port}'`);
            console.error(`  fuser -k ${port}/tcp`);
        }
    };

    const isPortInUse = port => {
        if (process.platform === 'win32') {
            const result = spawnSync('netstat', ['-ano', '-p', 'tcp'], {encoding: 'utf8'});
            if (result.error || result.status !== 0) {
                throw new Error(`Could not inspect local port ${port} with netstat.`, {cause: result.error});
            }
            return result.stdout.split(/\r?\n/).some(line => {
                const fields = line.trim().split(/\s+/);
                const localAddress = fields[1] || '';
                const localPort = Number(localAddress.match(/:(\d+)$/)?.[1]);
                return fields[0]?.toUpperCase() === 'TCP' &&
                    fields.at(-2)?.toUpperCase() === 'LISTENING' &&
                    localPort === port;
            });
        }

        const command = process.platform === 'linux' ? 'ss' : 'lsof';
        const args = process.platform === 'linux' ?
            ['-H', '-ltn', `sport = :${port}`] :
            ['-nP', '-t', `-iTCP:${port}`, '-sTCP:LISTEN'];
        const result = spawnSync(command, args, {encoding: 'utf8'});

        if (result.error) {
            throw new Error(`Could not run ${command} to inspect local port ${port}.`, {cause: result.error});
        }
        if (process.platform === 'linux') {
            if (result.status !== 0) {
                throw new Error(`Could not inspect local port ${port} with ss: ${result.stderr.trim()}`);
            }
            return Boolean(result.stdout.trim());
        }
        if (result.status === 1 && !result.stdout.trim()) {
            return false;
        }
        if (result.status !== 0) {
            throw new Error(`Could not inspect local port ${port} with lsof: ${result.stderr.trim()}`);
        }
        return Boolean(result.stdout.trim());
    };

    const checkPort = async port => {
        try {
            return await isPortInUse(port);
        } catch (error) {
            console.error(`No se pudo comprobar el puerto ${port}.`);
            printManualInstructions(port);
            throw error;
        }
    };

    const results = await Promise.all(ports.map(async port => ({
        port,
        inUse: await checkPort(port),
    })));
    const busyPorts = results.filter(({inUse}) => inUse).map(({port}) => port);

    if (busyPorts.length === 0) {
        console.log(`Puertos locales disponibles: ${ports.join(', ')}.`);
        return;
    }

    console.error(`Los siguientes puertos locales ya están ocupados: ${busyPorts.join(', ')}.`);
    for (const port of busyPorts) {
        printManualInstructions(port);
    }
    throw new Error(`Local startup stopped because ports ${busyPorts.join(', ')} are in use.`);
};
