let sequence = 0;

export function logGameTrace(event, details) {
    console.info(JSON.stringify({
        sequence: ++sequence,
        timestamp: new Date().toISOString(),
        event,
        ...details,
    }));
}
