const { spawn } = require('child_process');

let exp = {
    EventManager: class EventManager {
        constructor(){
            this.eventHandlers = {
                sendMessage: undefined,
                editMessage: undefined,
                deleteMessage: undefined,
                registerUser: undefined,
                loginUser: undefined,
                logoutUser: undefined,
                teapot: undefined,
            }
        }

        //#region SetHandler
        setSendMessageHandler(eventHandler){
            this.eventHandlers.sendMessage = eventHandler.callback;
        }
        setEditMessageHandler(eventHandler){
            this.eventHandlers.editMessage = eventHandler.callback;
        }
        setDeleteMessageHandler(eventHandler){
            this.eventHandlers.deleteMessage = eventHandler.callback;
        }
        setRegisterUserHandler(eventHandler){
            this.eventHandlers.registerUser = eventHandler.callback;
        }
        setLoginUserHandler(eventHandler){
            this.eventHandlers.loginUser = eventHandler.callback;
        }
        setLogoutUserHandler(eventHandler){
            this.eventHandlers.logoutUser = eventHandler.callback;
        }
        setTeapotHandler(eventHandler){
            this.eventHandlers.teapot = eventHandler.callback;
        }
        //#endregion

        //#region callHandlers
        callSendMessageHandler(args){
            if(this.eventHandlers.sendMessage){
                this.eventHandlers.sendMessage(args);
            }
        }
        callEditMessageHandler(args){
            if(this.eventHandlers.editMessage){
                this.eventHandlers.editMessage(args);
            }
        }
        callDeleteMessageHandler(args){
            if(this.eventHandlers.deleteMessage){
                this.eventHandlers.deleteMessage(args);
            }
        }
        callRegisterUserHandler(args){
            if(this.eventHandlers.registerUser){
                this.eventHandlers.registerUser(args);
            }
        }
        callLoginUserHandler(args){
            if(this.eventHandlers.loginUser){
                this.eventHandlers.loginUser(args);
            }
        }
        callLogoutUserHandler(args){
            if(this.eventHandlers.logoutUser){
                this.eventHandlers.logoutUser(args);
            }
        }
        callTeapotHandler(args){
            if(this.eventHandlers.teapot){
                this.eventHandlers.teapot(args);
            }
        }
        //#endregion

    },

    EventHandler: class EventHandler {
        constructor(type, call){
            switch (type) {
                case exp.shellEventHandler:
                    let command_split = call.split(' ');
                    let command = command_split.shift();
                    this.callback = function(args){
                        let new_args = command_split;
                        new_args.concat(args);
                        let sh = spawn(command, new_args);
                        sh.stderr.on( 'data', data => {
                            console.log( `${command}: stderr: ${data}` );
                        } );
                        sh.on( 'close', code => {
                            if(code != 0){
                                console.log( `${command} exited with code ${code}` );
                            }
                        } );
                    }
                    break;
                case exp.callbackEventHandler:
                    this.callback = call;
                default:
                    break;
            }
        }
    },

    shellEventHandler: 0,
    callbackEventHandler: 1,
}

module.exports = exp;