(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/scripts/MessageText.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'af1d6MLLQhPUKVU5lO61EMv', 'MessageText', __filename);
// scripts/MessageText.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        messageText: cc.Label,
        _waitText: "",
        _leftTime: 0,
        _isOver: false
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},
    setMsg: function setMsg(message, leftTime) {
        this.messageText.string = message;
        var delay = cc.delayTime(2);
        var self = this;
        var callFunc = cc.callFunc(function () {
            self.node.destroy();
        });
        var actFadeIn = cc.fadeIn(0.5);
        self.node.runAction(cc.sequence(actFadeIn, delay, callFunc));
    }

    // update (dt) {
    //     this._leftTime -= dt;
    //     var leftTime = Math.floor(this._leftTime); 
    //     if(this._leftTime >= 0) {
    //         this.messageText.string = this._waitText.format(leftTime);
    //     } else {
    //         if(this._isOver == false) {
    //             this.messageText.string = "";
    //             this.node.destroy();
    //             this._isOver = true;
    //         }
    //     }
    // },
});

cc._RF.pop();
        }
        if (CC_EDITOR) {
            __define(__module.exports, __require, __module);
        }
        else {
            cc.registerModuleFunc(__filename, function () {
                __define(__module.exports, __require, __module);
            });
        }
        })();
        //# sourceMappingURL=MessageText.js.map
        