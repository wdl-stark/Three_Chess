(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/scripts/CommonDefine.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '73ecfc8q4FBPIv76iGjJiIm', 'CommonDefine', __filename);
// scripts/CommonDefine.js

"use strict";

var CommonDefine = {};

CommonDefine.GameStateEnum = {
    None: 0,
    DropChess: 1,
    PressChess: 2,
    MoveChess: 3,
    EatChess: 4,
    End: 5
};

CommonDefine.PointTypeEnum = {
    Invalid: 0,
    Empty: 1,
    BlackChess: 2,
    WhiteChess: 3,
    DoubleChess: 4
};

window.CommonDefine = CommonDefine;

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
        //# sourceMappingURL=CommonDefine.js.map
        