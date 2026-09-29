import {endpoints} from "../../misc/endpoints.js";

export class Dialog {
    constructor(api) {
        this.api = api;
    }
    dialogResponse(params) {
        this.api.send({
            endpoint: endpoints.dialog.response,
            params
        })
    }
    listenDialog(callback) {
        this.api.listen({
            event: endpoints.dialog.open,
            callback: params => {
                callback({
                    ...params,
                    callback: this.dialogResponse.bind(this),
                });
            }
        });
    }
}