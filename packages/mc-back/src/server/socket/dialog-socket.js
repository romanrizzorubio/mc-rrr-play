import {EVENTS} from 'mc-endpoints';

export class DialogSocket {
    constructor(socket) {
        this.socket = socket;
    }
    get mc() {
        return this.socket.mc;
    }
    openDialog(params) {
        return new Promise(resolve => {
            this.socket.request(
                EVENTS.DIALOG.OPEN,
                params,
                EVENTS.DIALOG.RESPONSE,
                resolve,
            );
        });
    }
}