import {EVENTS} from 'mc-endpoints';

export class Dialog {
    constructor(api) {
        this.api = api;
    }
    dialogResponse(params) {
        return this.api.send({
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
                    callback: response => this.dialogResponse({
                        match: params.match,
                        requestId: params.requestId,
                        response,
                    }),
                });
            }
        });
    }
}