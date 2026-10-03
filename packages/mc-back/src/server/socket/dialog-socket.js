import {EVENTS} from 'mc-endpoints';

export class DialogSocket {
    constructor(mcSocket) {
        this.mcSocket = mcSocket;
        this.pending = new Map();
        this.requestSequence = 0;
    }
    openDialog(match, params) {
        const requestId = `${match.name}:${++this.requestSequence}`;
        const dialog = {
            ...params,
            match: match.name,
            requestId,
        };

        return new Promise((resolve, reject) => {
            this.pending.set(requestId, {
                matchName: match.name,
                dialog,
                resolve,
            });

            try {
                this.mcSocket.send(match.name, EVENTS.DIALOG.OPEN, dialog);
            } catch (error) {
                this.pending.delete(requestId);
                reject(error);
            }
        });
    }
    respond(matchName, params) {
        const {requestId, response} = params ?? {};
        const pending = this.pending.get(requestId);

        if (!pending || pending.matchName !== matchName) {
            return false;
        }

        this.pending.delete(requestId);
        pending.resolve(response);

        return true;
    }
    resendPending(matchName, socket) {
        for (const pending of this.pending.values()) {
            if (pending.matchName === matchName) {
                socket.emit(EVENTS.DIALOG.OPEN, pending.dialog);
            }
        }
    }
}