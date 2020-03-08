(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/scripts/Chess.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '92853RWg8BE3I2gKPW6og/w', 'Chess', __filename);
// scripts/Chess.js

"use strict";

var PointTypeEnum = {
    Invalid: 0,
    Empty: 1,
    BlackChess: 2,
    WhiteChess: 3,
    DoubleChess: 4
};

cc.Class({
    extends: cc.Component,

    properties: {
        ChessImage: cc.Sprite,
        ChessSprite: [cc.SpriteFrame],
        HighLightSprite: [cc.SpriteFrame],
        SmallWhiteDot: cc.Node,
        _point: null,
        Point: {
            get: function get() {
                return this._point;
            },
            set: function set(value) {
                this._point = value;
            }
        },
        IsBlack: true,
        SrcPos: null,
        IsCurrentFlag: {
            set: function set(value) {
                this.SmallWhiteDot.active = value;
            }
        }
    },

    start: function start() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchChess, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onMoveChess, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onMoveEnd, this);
    },
    InitChess: function InitChess(isBlack, isNew) {
        this.IsBlack = isBlack;
        this.ChessImage.spriteFrame = isBlack ? this.ChessSprite[0] : this.ChessSprite[1];
        this.IsCurrentFlag = isNew;
    },
    Flash: function Flash() {
        this.ChessImage.spriteFrame = this.IsBlack ? this.HighLightSprite[0] : this.HighLightSprite[1];
        this.node.getComponent(cc.Animation).play();
    },
    StopFlash: function StopFlash() {
        this.ChessImage.spriteFrame = this.IsBlack ? this.ChessSprite[0] : this.ChessSprite[1];
        this.node.getComponent(cc.Animation).stop();
        this.node.opacity = 255;
    },
    onTouchChess: function onTouchChess(event) {
        if (window.GameController.GameState == CommonDefine.GameStateEnum.MoveChess && this.IsBlack == window.GameController.IsBlackTurn) {
            window.GameController.NewChess.IsCurrentFlag = false;
            this.IsCurrentFlag = true;
            window.GameController.NewChess = this;
            return;

            var root = cc.find("Canvas");
            var pos = this.node.position;
            var worldPos = this.node.parent.convertToWorldSpaceAR(pos);
            var localPos = root.convertToNodeSpaceAR(worldPos);
            this.node.parent = root;
            this.node.position = localPos;
            this.SrcPos = pos;
            return;
        } else if (window.GameController.GameState == CommonDefine.GameStateEnum.EatChess && this.IsBlack == !window.GameController.IsBlackTurn) {
            window.GameController.EatChess(this.node);
        }
    },
    onMoveChess: function onMoveChess(event) {
        return;
        if (window.GameController.GameState != CommonDefine.GameStateEnum.MoveChess || this.IsBlack != window.GameController.IsBlackTurn) {
            return;
        }

        var delta = event.touch.getDelta();
        this.node.x += delta.x;
        this.node.y += delta.y;
    },
    onMoveEnd: function onMoveEnd(event) {
        return;
        if (window.GameController.GameState != CommonDefine.GameStateEnum.MoveChess || this.IsBlack != window.GameController.IsBlackTurn) {
            return;
        }
        var parent = window.GameController.Board;
        var pos = this.node.position;
        var worldPos = this.node.parent.convertToWorldSpaceAR(pos);
        var localPos = parent.convertToNodeSpaceAR(worldPos);
        var point = window.GameController.CheckPosInPoint(localPos, CommonDefine.PointTypeEnum.Empty);
        if (point != null) //坐标点落在某个棋盘点上且该棋盘点上无子
            {
                var bCanMove = window.GameController.CheckCanMoveTo(this.Point, point);
                if (bCanMove) //该棋盘点是当前棋子的合法行走点
                    {
                        var centerPos = window.GameController.Point2Position(point);
                        this.node.parent = parent;
                        this.node.position = centerPos;
                        var prePt = cc.v2(this.Point.x, this.Point.y);
                        this.Point = point;
                        window.GameController.NewChess.IsCurrentFlag = false;
                        this.IsCurrentFlag = true;
                        window.GameController.NewChess = this;
                        window.GameController.AfterMoveTo(prePt, point);
                    } else {
                    //不合法，回退
                    this.node.position = this.SrcPos;
                    this.node.parent = parent;
                }
            } else {
            //没有移动到交叉点上,还原到移动前的位置
            this.node.position = this.SrcPos;
            this.node.parent = parent;
        }
    }
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
        //# sourceMappingURL=Chess.js.map
        