import {endpoints} from "../../constants/endpoints.js";

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
                endpoints.dialog.open,
                params,
                endpoints.dialog.response,
                resolve,
            );
        })
    }
}