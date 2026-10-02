import {EVENTS} from 'mc-endpoints';

export class Dialog {
    constructor(api) {
        this.api = api;
    }
    dialogResponse(params) {
        this.api.send({
            endpoint: EVENTS.DIALOG.RESPONSE,
            params
        });
    }
    listenDialog(callback) {
        this.api.listen({
            event: EVENTS.DIALOG.OPEN,
            callback: params => {
                callback({
                    ...params,
                    callback: this.dialogResponse.bind(this),
                });
            }
        });
    }
}