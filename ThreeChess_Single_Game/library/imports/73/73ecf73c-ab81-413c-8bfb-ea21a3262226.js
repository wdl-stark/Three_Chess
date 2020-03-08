"use strict";
cc._RF.push(module, '73ecfc8q4FBPIv76iGjJiIm', 'CommonDefine');
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