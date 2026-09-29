import {DialogSocket} from "./dialog-socket.js";

export class McSocket {
    constructor(mc) {
        this.mc = mc;

        this.dialogSocket = new DialogSocket(this);
    }
    get socket() {
        return this.mc.socket;
    }
    listen(endpoint, callback, once = false) {
        const _callback = response => {
            if (once) {
                this.socket.off(endpoint, _callback);
            }
            callback(response);
        }

        this.socket.on(endpoint, _callback);
    }
    send(endpoint, params) {
        this.socket.emit(endpoint, params);
    }
    request(endpoint, params, event, callback) {
        this.listen(event, callback, true);
        this.send(endpoint, params);
    }
}