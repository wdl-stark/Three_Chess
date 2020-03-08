(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/scripts/MessageBox/MessageDialog.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '64436rDNylB0I+2iulhd7Aa', 'MessageDialog', __filename);
// scripts/MessageBox/MessageDialog.js

'use strict';

// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

var MessageBox = {};

(function () {
    MessageBox.OK = 0;
    MessageBox.OKCancel = 1;

    MessageBox.StyleEnum = cc.Enum({
        OK: 0,
        OKCancel: 1
    });

    MessageBox.ButtonStyle = cc.Enum({
        OK: 0,
        CANCLE: 1,
        RECONNECT: 2,
        BACKLOGIN: 3,
        GOUP: 4,
        CONTINUE: 5,
        GOSHOP: 6,
        GOCHECK: 7,
        DELAYGO: 8
    });

    MessageBox.show = function (message, type, callBack) {
        var instance = cc.instantiate(window.MessageBoxPref);
        instance.parent = cc.find('Canvas');
        instance.zIndex = cc.macro.MAX_ZINDEX;
        var messageDialog = instance.getComponent('MessageDialog');
        messageDialog.show(message, type, callBack);
    };

    window.MessageBox = MessageBox;
})();

cc.Class({
    extends: cc.Component,

    properties: {
        okButton: {
            default: null,
            type: cc.Node
        },

        cancelButton: {
            default: null,
            type: cc.Node
        },

        oKImage: {
            default: null,
            type: cc.Sprite
        },
        cancelImage: {
            default: null,
            type: cc.Sprite
        },

        contentLabel: {
            default: null,
            type: cc.Label
        },

        ButtonTexts: {
            default: [],
            type: cc.SpriteFrame
        },
        LeftOKBtnNode: cc.Node,
        RightCancelBtnNode: cc.Node,
        CenterOKBtnNode: cc.Node,
        _style: -1,
        Style: {
            get: function get() {
                return this._style;
            },
            set: function set(value) {
                this._style = value;
                if (value == MessageBox.StyleEnum.OKCancel) {
                    this.okButton.position = this.LeftOKBtnNode.position;
                    this.okButton.active = true;
                    this.cancelButton.position = this.RightCancelBtnNode.position;
                    this.cancelButton.active = true;
                } else if (value == MessageBox.StyleEnum.OK) {
                    this.okButton.position = this.CenterOKBtnNode.position;
                    this.okButton.active = true;
                    this.cancelButton.active = false;
                }
            }
        },
        __callBack: null
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad: function onLoad() {
        //this.callBack = null;
    },


    show: function show(content, type, callBack) {
        var self = this;
        this.Style = type;

        this.__callBack = callBack;
        self.contentLabel.string = content;
    },

    onOKButtonClicked: function onOKButtonClicked() {
        if (this.__callBack) {
            this.__callBack(true);
        }
        this.node.destroy();
    },

    onCancelButtonClicked: function onCancelButtonClicked() {
        if (this.__callBack) {
            this.__callBack(false);
        }
        this.node.destroy();
    }
    // update (dt) {},
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
        //# sourceMappingURL=MessageDialog.js.map
        