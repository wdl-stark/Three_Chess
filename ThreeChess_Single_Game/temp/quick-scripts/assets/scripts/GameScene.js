(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/scripts/GameScene.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'c7b5c4wJlRBdKtgcREgq7W9', 'GameScene', __filename);
// scripts/GameScene.js

"use strict";

var BoardWidth = 500;
var width = BoardWidth / 6;
var CENTER = 3; //中心那个点
var GameStateEnum = {
    None: 0,
    DropChess: 1,
    PressChess: 2,
    MoveChess: 3,
    EatChess: 4,
    GameEnd: 5
};

var PointTypeEnum = {
    Invalid: 0,
    Empty: 1,
    BlackChess: 2,
    WhiteChess: 3,
    DoubleChess: 4
};

var WinOrLoseEnum = {
    NotEndYet: 0,
    BlackWin: 1,
    WhiteWin: 2
};

cc.Class({
    extends: cc.Component,

    properties: {
        ChessPrefab: cc.Prefab,
        MessageTextPrefab: cc.Prefab,
        RulePrefab: cc.Prefab,
        MessageBoxPref: cc.Prefab,
        Board: cc.Node,
        _gameState: 0,
        GameState: {
            get: function get() {
                return this._gameState;
            },
            set: function set(value) {
                this._gameState = value;
            }
        },
        IsBlackTurn: true,
        ThreeTypeCount: 0,
        ChessNodes: {
            default: [],
            visible: false
        },
        HighLightThreePoints: {
            default: [],
            visible: false
        },
        NewChess: {
            default: null,
            visible: false
        },
        Notice: cc.Label,
        ColorStr: {
            get: function get() {
                if (this.IsBlackTurn) {
                    return "蓝色";
                } else {
                    return "橙色";
                }
            }
        },
        TurnNoticeStr: {
            get: function get() {
                return "轮到" + this.ColorStr + "走棋";
            }
        }
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start: function start() {
        this.Board.on(cc.Node.EventType.TOUCH_START, this.onTouchBoard, this);
        this.Board.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        window.GameController = this;
        window.MessageBoxPref = this.MessageBoxPref;
        this.StartGame();
    },
    StartGame: function StartGame() {
        this.ChessPoints = [[1, 0, 0, 1, 0, 0, 1], [0, 1, 0, 1, 0, 1, 0], [0, 0, 1, 1, 1, 0, 0], [1, 1, 1, 0, 1, 1, 1], [0, 0, 1, 1, 1, 0, 0], [0, 1, 0, 1, 0, 1, 0], [1, 0, 0, 1, 0, 0, 1]];
        this.ThreePointsMap = new Map();
        this.PointsCanMovies = new Map(); //每个点的所有走法
        for (var i = 0; i < this.ChessPoints.length; i++) {
            var line = this.ChessPoints[i];
            for (var j = 0; j < line.length; j++) {
                var ptValue = line[j];
                if (ptValue != 1) {
                    continue;
                }
                var pt = cc.v2(i, j);
                if (i == 0 || i == 6) //第0,6行
                    {
                        if (j == 0 || j == 6) {
                            /*
                            [2,0,0,1,0,0,2],
                            [0,1,0,1,0,1,0],
                            [0,0,1,1,1,0,0],
                            [1,1,1,0,1,1,1],
                            [0,0,1,1,1,0,0],
                            [0,1,0,1,0,1,0],
                            [2,0,0,1,0,0,2]
                             */
                            //第(0,0),(0,6)(6,0),(6,6)点
                            var rowOffset = i == 0 ? 1 : -1;
                            var colOffset = j == 0 ? 1 : -1;
                            var oneLine = [];
                            var lines = [];
                            //横
                            oneLine.push(cc.v2(i, 3));
                            oneLine.push(cc.v2(i, CENTER + 3 * colOffset));
                            lines.push(oneLine);

                            //竖
                            oneLine = [];
                            oneLine.push(cc.v2(3, j));
                            oneLine.push(cc.v2(CENTER + 3 * rowOffset, j));
                            lines.push(oneLine);

                            //斜
                            oneLine = [];
                            oneLine.push(cc.v2(i + 1 * rowOffset, j + 1 * colOffset));
                            oneLine.push(cc.v2(i + 2 * rowOffset, j + 2 * colOffset));
                            lines.push(oneLine);

                            this.ThreePointsMap.set(pt, lines);

                            //每个点的所有走法
                            var moveis = [];
                            rowOffset = i == 0 ? 1 : -1;
                            colOffset = j == 0 ? 1 : -1;
                            moveis.push(cc.v2(i, 3));
                            moveis.push(cc.v2(3, j));
                            moveis.push(cc.v2(i + 1 * rowOffset, j + 1 * colOffset));
                            this.PointsCanMovies.set(pt, moveis);
                        } else if (j == 3) {
                            //第(0,3),(6,3)点
                            var _rowOffset = i == 0 ? 1 : -1;
                            var _oneLine = [];
                            var _lines = [];
                            //横
                            _oneLine.push(cc.v2(i, 0));
                            _oneLine.push(cc.v2(i, 6));
                            _lines.push(_oneLine);
                            //竖
                            _oneLine = [];
                            _oneLine.push(cc.v2(i + 1 * _rowOffset, 3));
                            _oneLine.push(cc.v2(i + 2 * _rowOffset, 3));
                            _lines.push(_oneLine);
                            this.ThreePointsMap.set(pt, _lines);

                            var _moveis = [];
                            _rowOffset = i == 0 ? 1 : -1;
                            _moveis.push(cc.v2(i, 0));
                            _moveis.push(cc.v2(i, 6));
                            _moveis.push(cc.v2(i + 1 * _rowOffset, 3));
                            this.PointsCanMovies.set(pt, _moveis);
                        }
                    } else if (i == 1 || i == 5) //第1,5行
                    {
                        if (j == 1 || j == 5) {
                            /*
                            [1,0,0,1,0,0,1],
                            [0,2,0,1,0,2,0],
                            [0,0,1,1,1,0,0],
                            [1,1,1,0,1,1,1],
                            [0,0,1,1,1,0,0],
                            [0,2,0,1,0,2,0],
                            [1,0,0,1,0,0,1]
                            */
                            //第(1,1),(1,5),(5,1)(5,5)点
                            var _rowOffset2 = i == 1 ? 1 : -1;
                            var _colOffset = j == 1 ? 1 : -1;
                            //横
                            var _oneLine2 = [];
                            var _lines2 = [];
                            _oneLine2.push(cc.v2(i, 3));
                            _oneLine2.push(cc.v2(i, 3 + 2 * _colOffset));
                            _lines2.push(_oneLine2);
                            //竖
                            _oneLine2 = [];
                            _oneLine2.push(cc.v2(3, j));
                            _oneLine2.push(cc.v2(3 + 2 * _rowOffset2, j));
                            _lines2.push(_oneLine2);
                            //斜
                            _oneLine2 = [];
                            _rowOffset2 = i == 1 ? 1 : -1;
                            _colOffset = j == 1 ? 1 : -1;
                            _oneLine2.push(cc.v2(i + 1 * _rowOffset2, j + 1 * _colOffset));
                            _oneLine2.push(cc.v2(i - 1 * _rowOffset2, j - 1 * _colOffset));
                            _lines2.push(_oneLine2);
                            this.ThreePointsMap.set(pt, _lines2);

                            var _moveis2 = [];
                            _rowOffset2 = i == 1 ? 1 : -1;
                            _colOffset = j == 1 ? 1 : -1;
                            _moveis2.push(cc.v2(i, 3));
                            _moveis2.push(cc.v2(3, j));
                            _moveis2.push(cc.v2(i + 1 * _rowOffset2, j + 1 * _colOffset));
                            _rowOffset2 = i == 1 ? -1 : 1;
                            _colOffset = j == 1 ? -1 : 1;
                            _moveis2.push(cc.v2(i + 1 * _rowOffset2, j + 1 * _colOffset));
                            this.PointsCanMovies.set(pt, _moveis2);
                        } else if (j == 3) {
                            /*
                                [1,0,0,1,0,0,1],
                                [0,1,0,2,0,1,0],
                                [0,0,1,1,1,0,0],
                                [1,1,1,0,1,1,1],
                                [0,0,1,1,1,0,0],
                                [0,1,0,2,0,1,0],
                                [1,0,0,1,0,0,1];
                            */
                            //横
                            var _oneLine3 = [];
                            var _lines3 = [];
                            _oneLine3.push(cc.v2(i, 1));
                            _oneLine3.push(cc.v2(i, 5));
                            _lines3.push(_oneLine3);
                            //竖
                            _oneLine3 = [];
                            _oneLine3.push(cc.v2(i - 1, 3));
                            _oneLine3.push(cc.v2(i + 1, 3));
                            _lines3.push(_oneLine3);
                            this.ThreePointsMap.set(pt, _lines3);

                            var _moveis3 = [];
                            _moveis3.push(cc.v2(i, 1));
                            _moveis3.push(cc.v2(i, 5));
                            _moveis3.push(cc.v2(i + 1, 3));
                            _moveis3.push(cc.v2(i - 1, 3));
                            this.PointsCanMovies.set(pt, _moveis3);
                        }
                    } else if (i == 2 || i == 4) {
                    if (j == 2 || j == 4) {
                        /*
                            [1,0,0,1,0,0,1],
                            [0,1,0,1,0,1,0],
                            [0,0,2,1,2,0,0],
                            [1,1,1,0,1,1,1],
                            [0,0,2,1,2,0,0],
                            [0,1,0,1,0,1,0],
                            [1,0,0,1,0,0,1];
                        */
                        var _rowOffset3 = i == 2 ? 1 : -1;
                        var _colOffset2 = j == 2 ? 1 : -1;
                        //横
                        var _oneLine4 = [];
                        var _lines4 = [];
                        _oneLine4.push(cc.v2(i, 3));
                        _oneLine4.push(cc.v2(i, 3 + 1 * _colOffset2));
                        _lines4.push(_oneLine4);
                        //竖
                        _oneLine4 = [];
                        _oneLine4.push(cc.v2(i + 1 * _rowOffset3, j));
                        _oneLine4.push(cc.v2(i + 2 * _rowOffset3, j));
                        _lines4.push(_oneLine4);
                        //斜
                        _oneLine4 = [];
                        _rowOffset3 = i == 2 ? -1 : 1;
                        _colOffset2 = j == 2 ? -1 : 1;
                        _oneLine4.push(cc.v2(i + 1 * _rowOffset3, j + 1 * _colOffset2));
                        _oneLine4.push(cc.v2(i + 2 * _rowOffset3, j + 2 * _colOffset2));
                        _lines4.push(_oneLine4);
                        this.ThreePointsMap.set(pt, _lines4);

                        //每个点的所有走法
                        var _moveis4 = [];
                        _rowOffset3 = i == 2 ? -1 : 1;
                        _colOffset2 = j == 2 ? -1 : 1;
                        _moveis4.push(cc.v2(i, 3));
                        _moveis4.push(cc.v2(3, j));
                        _moveis4.push(cc.v2(i + 1 * _rowOffset3, j + 1 * _colOffset2));
                        this.PointsCanMovies.set(pt, _moveis4);
                    } else if (j == 3) {

                        var _rowOffset4 = i == 2 ? -1 : 1;
                        //横
                        var _oneLine5 = [];
                        var _lines5 = [];
                        _oneLine5.push(cc.v2(i, 2));
                        _oneLine5.push(cc.v2(i, 4));
                        _lines5.push(_oneLine5);
                        //竖
                        _oneLine5 = [];
                        _oneLine5.push(cc.v2(i + 1 * _rowOffset4, 3));
                        _oneLine5.push(cc.v2(i + 2 * _rowOffset4, 3));
                        _lines5.push(_oneLine5);
                        this.ThreePointsMap.set(pt, _lines5);

                        //每个点的所有走法
                        var _moveis5 = [];
                        _rowOffset4 = i == 2 ? -1 : 1;
                        _moveis5.push(cc.v2(i, 2));
                        _moveis5.push(cc.v2(i, 4));
                        _moveis5.push(cc.v2(i + 1 * _rowOffset4, 3));
                        this.PointsCanMovies.set(pt, _moveis5);
                    }
                } else if (i == 3) {
                    if (j == 0 || j == 6) {
                        var _colOffset3 = j == 0 ? 1 : -1;
                        //横
                        var _oneLine6 = [];
                        var _lines6 = [];
                        _oneLine6.push(cc.v2(3, j + 1 * _colOffset3));
                        _oneLine6.push(cc.v2(3, j + 2 * _colOffset3));
                        _lines6.push(_oneLine6);
                        //竖
                        _oneLine6 = [];
                        _oneLine6.push(cc.v2(0, j));
                        _oneLine6.push(cc.v2(6, j));
                        _lines6.push(_oneLine6);
                        this.ThreePointsMap.set(pt, _lines6);

                        //每个点的所有走法
                        var _moveis6 = [];
                        _colOffset3 = j == 0 ? 1 : -1;
                        _moveis6.push(cc.v2(0, j));
                        _moveis6.push(cc.v2(6, j));
                        _moveis6.push(cc.v2(3, j + 1 * _colOffset3));
                        this.PointsCanMovies.set(pt, _moveis6);
                    } else if (j == 1 || j == 5) {
                        /*
                            [1,0,0,1,0,0,1],
                            [0,1,0,1,0,1,0],
                            [0,0,1,1,1,0,0],
                            [1,2,1,0,1,2,1],
                            [0,0,1,1,1,0,0],
                            [0,1,0,1,0,1,0],
                            [1,0,0,1,0,0,1];
                        */
                        //横
                        var _oneLine7 = [];
                        var _lines7 = [];
                        _oneLine7.push(cc.v2(3, j - 1));
                        _oneLine7.push(cc.v2(3, j + 1));
                        _lines7.push(_oneLine7);
                        //竖
                        _oneLine7 = [];
                        _oneLine7.push(cc.v2(1, j));
                        _oneLine7.push(cc.v2(5, j));
                        _lines7.push(_oneLine7);
                        this.ThreePointsMap.set(pt, _lines7);

                        //每个点的所有走法
                        var _moveis7 = [];
                        _moveis7.push(cc.v2(3, j - 1));
                        _moveis7.push(cc.v2(3, j + 1));
                        _moveis7.push(cc.v2(i - 2, j));
                        _moveis7.push(cc.v2(i + 2, j));
                        this.PointsCanMovies.set(pt, _moveis7);
                    } else if (j == 2 || j == 4) {
                        /*
                                                    [1,0,0,1,0,0,1],
                                                    [0,1,0,1,0,1,0],
                                                    [0,0,1,1,1,0,0],
                                                    [1,1,2,0,2,1,1],
                                                    [0,0,1,1,1,0,0],
                                                    [0,1,0,1,0,1,0],
                                                    [1,0,0,1,0,0,1];
                                                */
                        //横
                        var _colOffset4 = j == 2 ? -1 : 1;
                        var _oneLine8 = [];
                        var _lines8 = [];
                        _oneLine8.push(cc.v2(3, j + 1 * _colOffset4));
                        _oneLine8.push(cc.v2(3, j + 2 * _colOffset4));
                        _lines8.push(_oneLine8);
                        //竖
                        _oneLine8 = [];
                        _oneLine8.push(cc.v2(2, j));
                        _oneLine8.push(cc.v2(4, j));
                        _lines8.push(_oneLine8);
                        this.ThreePointsMap.set(pt, _lines8);

                        //每个点的所有走法
                        var _moveis8 = [];
                        _colOffset4 = j == 2 ? -1 : 1;
                        _moveis8.push(cc.v2(3, j + 1 * _colOffset4));
                        _moveis8.push(cc.v2(i - 1, j));
                        _moveis8.push(cc.v2(i + 1, j));
                        this.PointsCanMovies.set(pt, _moveis8);
                    }
                }
            }
        }

        console.log("所有点的成三点", this.ThreePointsMap);
        console.log("点的所有可移动点", this.PointsCanMovies);
        //console.log(this.ThreePointsMap);
        this.ResetGame();
        this.GameState = GameStateEnum.DropChess;

        this.ShowMessage(this.TurnNoticeStr);
    },
    ResetGame: function ResetGame() {
        if (this.ChessNodes.length > 0) {
            this.ChessNodes.forEach(function (node) {
                node.destroy();
            });
        }
        this.ChessNodes = [];
        this.NewChess = null;
    },
    StartButtonClick: function StartButtonClick() {
        this.StartGame();
    },
    test: function test() {
        MessageBox.show("蓝色赢了", MessageBox.OK);
    },
    Point2Position: function Point2Position(pt) {
        //棋盘上某个交叉点的坐标为: 
        //x坐标=(交叉点的列索引-3)*width,
        //y坐标=(3-交叉点的行索引)*width
        var pos = cc.v2((pt.y - 3) * width, (3 - pt.x) * width);
        return pos;
    },
    onTouchBoard: function onTouchBoard(event) {
        if (this.GameState == GameStateEnum.None) {
            return;
        }
    },
    onTouchEnd: function onTouchEnd(event) {
        if (this.GameState != GameStateEnum.DropChess && this.GameState != GameStateEnum.PressChess && this.GameState != GameStateEnum.MoveChess) {
            return;
        }
        var pos = event.getLocation();
        var worldPos = this.node.parent.convertToWorldSpaceAR(pos);
        var localPos = this.Board.convertToNodeSpaceAR(worldPos);
        //落子状态
        if (this.GameState == GameStateEnum.DropChess) {
            //落子
            var pt = this.CheckPosInPoint(localPos, PointTypeEnum.Empty);
            if (pt != null) {
                var chess = cc.instantiate(this.ChessPrefab);
                chess.parent = this.Board;
                var _pos = this.Point2Position(pt);
                chess.position = _pos;
                chess.getComponent('Chess').InitChess(this.IsBlackTurn, true);
                chess.getComponent('Chess').Point = pt;
                this.ChessNodes.push(chess);
                this.ChessPoints[pt.x][pt.y] = this.IsBlackTurn ? PointTypeEnum.BlackChess : PointTypeEnum.WhiteChess;

                if (this.NewChess != null) {
                    this.NewChess.IsCurrentFlag = false;
                }
                this.NewChess = chess.getComponent('Chess');

                this.CheckThree(pt);
                if (this.ThreeTypeCount > 0) //成三了
                    {
                        this.GameState = GameStateEnum.PressChess;
                    } else {
                    this.IsBlackTurn = !this.IsBlackTurn;
                    this.ShowMessage(this.TurnNoticeStr);
                    this.CheckDropPhaseFinish();
                }
            }

            return;
        }
        //压子状态
        else if (this.GameState == GameStateEnum.PressChess) {
                if (this.ThreeTypeCount > 0) {
                    var type = this.IsBlackTurn ? PointTypeEnum.WhiteChess : PointTypeEnum.BlackChess;
                    var pt2 = this.CheckPosInPoint(localPos, type);
                    if (pt2 != null) {
                        this.ThreeTypeCount--;
                        this.ChessPoints[pt2.x][pt2.y] = PointTypeEnum.DoubleChess;
                        for (var i = 0; i < this.ChessNodes.length; i++) {
                            var _chess = this.ChessNodes[i];
                            var tempPt = _chess.getComponent('Chess').Point;
                            if (tempPt.x == pt2.x && tempPt.y == pt2.y) {
                                var newChess = cc.instantiate(this.ChessPrefab);
                                newChess.parent = this.Board;
                                newChess.getComponent('Chess').Point = pt2;
                                newChess.getComponent('Chess').InitChess(this.IsBlackTurn, false);
                                newChess.position = this.Point2Position(pt2);
                                if (pt2.x == 3) {
                                    newChess.y += 8;
                                    _chess.y -= 8;
                                } else {
                                    newChess.x += 8;
                                    _chess.x -= 8;
                                }

                                this.ChessNodes.push(newChess);
                                break;
                            }
                        }
                        if (this.ThreeTypeCount > 0) {
                            var msg = this.ColorStr + "还可以吃对方" + this.ThreeTypeCount + "个子";
                            this.ShowMessage(msg);
                        }
                    }
                }
                if (this.ThreeTypeCount == 0) {
                    if (this.HighLightThreePoints.length > 0) {
                        this.HighLightChesses(false);
                        this.HighLightThreePoints = [];
                    }
                    if (this.NewChess != null) {
                        this.NewChess.IsCurrentFlag = false;
                    }
                    this.GameState = GameStateEnum.DropChess;
                    this.IsBlackTurn = !this.IsBlackTurn;
                    this.ShowMessage(this.TurnNoticeStr);
                }
                this.CheckDropPhaseFinish();
            } else if (this.GameState == GameStateEnum.MoveChess) {
                var point = this.CheckPosInPoint(localPos, CommonDefine.PointTypeEnum.Empty);
                if (point != null) //坐标点落在某个棋盘点上且该棋盘点上无子
                    {
                        var bCanMove = this.CheckCanMoveTo(this.NewChess.Point, point);
                        if (bCanMove) //该棋盘点是当前棋子的合法行走点
                            {
                                var centerPos = this.Point2Position(point);
                                this.NewChess.node.runAction(cc.moveTo(0.3, centerPos));
                                var prePt = cc.v2(this.NewChess.Point.x, this.NewChess.Point.y);
                                this.NewChess.Point = point;
                                this.AfterMoveTo(prePt, point);
                            }
                    }
            }
    },
    CheckPosInPoint: function CheckPosInPoint(pressPos, needPointType) {
        var pt = null;
        console.log("CheckPosInPoint,pressPos=", pressPos);
        for (var i = 0; i < this.ChessPoints.length; i++) {
            var line = this.ChessPoints[i];
            for (var j = 0; j < line.length; j++) {
                var ptValue = line[j];
                if (ptValue == needPointType) {
                    var ptPos = this.Point2Position(cc.v2(i, j));
                    //判断触摸点是否在棋盘某个交叉点上
                    console.log("x=", i, ",y=", j);
                    if (Math.abs(ptPos.x - pressPos.x) <= width / 2 && Math.abs(ptPos.y - pressPos.y) <= width / 2) {
                        pt = cc.v2(i, j);
                        //console.log(this.ChessPoints);
                        return pt;
                    }
                }
            }
        }
        return pt;
    },
    CheckCanMoveTo: function CheckCanMoveTo(srcPoint, dstPoint) {
        var movies = null;
        this.PointsCanMovies.forEach(function (value, key) {
            if (srcPoint.x == key.x && srcPoint.y == key.y) {
                movies = value;
            }
        });
        if (movies == null || movies.length == 0) {
            return false;
        }
        for (var i = 0; i < movies.length; i++) {
            if (movies[i].x == dstPoint.x && movies[i].y == dstPoint.y) {
                return true;
            }
        }
        return false;
    },
    AfterMoveTo: function AfterMoveTo(srcPoint, dstPoint) {
        this.ChessPoints[dstPoint.x][dstPoint.y] = this.ChessPoints[srcPoint.x][srcPoint.y];
        this.ChessPoints[srcPoint.x][srcPoint.y] = CommonDefine.PointTypeEnum.Empty;
        //判断走棋后是否成三
        var threeTypeCount = this.CheckThree(dstPoint);
        if (threeTypeCount > 0) {
            this.GameState = CommonDefine.GameStateEnum.EatChess;
        } else {
            this.IsBlackTurn = !this.IsBlackTurn;
        }
    },
    CheckThree: function CheckThree(point) {
        var _this = this;

        var threeTypeCount = 0;
        this.ThreePointsMap.forEach(function (value, key) {
            if (point.x == key.x && point.y == key.y) {
                var lines = value;
                //检查该点的横，竖，斜线方向的点是否形成一个“三”
                lines.forEach(function (oneLine) {
                    var sameChessNum = 0;
                    oneLine.forEach(function (pt) {
                        var ptValue = _this.ChessPoints[pt.x][pt.y];
                        //console.log("CheckThree pt.x=",pt.x,",pt.y=",pt.y);
                        if (ptValue == PointTypeEnum.BlackChess || ptValue == PointTypeEnum.WhiteChess) {
                            if (ptValue == _this.ChessPoints[point.x][point.y]) {
                                sameChessNum++;
                            }
                        }
                    });
                    if (sameChessNum == oneLine.length) {
                        threeTypeCount++;
                        oneLine.forEach(function (pt) {
                            if (_this.HighLightThreePoints.indexOf(pt) == -1) {
                                _this.HighLightThreePoints.push(pt);
                            }
                        });
                    }
                });
            }
        });

        if (this.HighLightThreePoints.length > 0) {
            this.HighLightThreePoints.push(point);
            this.HighLightChesses(true);
        }
        this.ThreeTypeCount = threeTypeCount;
        if (threeTypeCount > 0) {
            var msg = this.ColorStr + "形成了" + this.ThreeTypeCount + "个三子,可以吃掉对方" + this.ThreeTypeCount + "个棋子";
            this.ShowMessage(msg);
        }
        return threeTypeCount;
    },
    HighLightChesses: function HighLightChesses(isFlash) {
        var _this2 = this;

        if (!this.HighLightThreePoints || this.HighLightThreePoints.length <= 0) {
            return;
        }
        this.HighLightThreePoints.forEach(function (pt) {
            _this2.ChessNodes.forEach(function (node) {
                var chess = node.getComponent('Chess');
                if (chess.Point.x == pt.x && chess.Point.y == pt.y) {
                    if (isFlash) {
                        chess.Flash();
                    } else {
                        chess.StopFlash();
                    }
                }
            });
        });
    },
    CheckDropPhaseFinish: function CheckDropPhaseFinish() {
        if (this.IsBoardFull()) {
            for (var i = 0; i < this.ChessPoints.length; i++) {
                for (var j = 0; j < this.ChessPoints[i].length; j++) {
                    var ptValue = this.ChessPoints[i][j];
                    var point = cc.v2(i, j);
                    //删除成对的子
                    if (ptValue == 4) {
                        this.ChessPoints[i][j] = 1;
                        for (var k = 0; k < this.ChessNodes.length; k++) {
                            var chess = this.ChessNodes[k];
                            var tempPt = chess.getComponent('Chess').Point;
                            if (tempPt.x == point.x && tempPt.y == point.y) {
                                this.ChessNodes.delete(chess);
                                chess.destroy();
                            }
                        }
                    }
                }
            }
            this.GameState = GameStateEnum.MoveChess;
            this.IsBlackTurn = false; //摆棋阶段黑子先布子，则动子白子先动子
            this.ShowMessage(this.TurnNoticeStr);
        }
    },
    IsBoardFull: function IsBoardFull() {
        for (var i = 0; i < this.ChessPoints.length; i++) {
            for (var j = 0; j < this.ChessPoints[i].length; j++) {
                var ptValue = this.ChessPoints[i][j];
                if (ptValue == 1) {
                    return false;
                }
            }
        }
        return true;
    },
    EatChess: function EatChess(chessNode) {
        if (this.GameState != CommonDefine.GameStateEnum.EatChess) {
            return;
        }
        var pt = chessNode.getComponent('Chess').Point;
        this.ChessPoints[pt.x][pt.y] = CommonDefine.PointTypeEnum.Empty;
        this.ChessNodes.delete(chessNode);
        chessNode.destroy();
        var endStatus = this.JudgeWin();
        if (endStatus != WinOrLoseEnum.NotEndYet) {
            return;
        }
        this.ThreeTypeCount--;
        if (this.ThreeTypeCount > 0) {
            var msg = this.ColorStr + "还可以吃对方" + this.ThreeTypeCount + "个子";
            this.ShowMessage(msg);
        } else {
            if (this.HighLightThreePoints.length > 0) {
                this.HighLightChesses(false);
                this.HighLightThreePoints = [];
            }
            this.IsBlackTurn = !this.IsBlackTurn;
            this.ShowMessage(this.TurnNoticeStr);
            this.GameState = CommonDefine.GameStateEnum.MoveChess;
        }
    },
    JudgeWin: function JudgeWin() {
        var blackCount = 0;
        var wihteCount = 0;
        this.ChessNodes.forEach(function (node) {
            var chess = node.getComponent('Chess');
            if (chess.IsBlack) {
                blackCount++;
            } else {
                wihteCount++;
            }
        });
        var status = WinOrLoseEnum.NotEndYet;
        if (blackCount <= 2) {
            var msg = "橙色方赢了";
            MessageBox.show(msg, MessageBox.OK);
            status = WinOrLoseEnum.WhiteWin;
        } else if (wihteCount <= 2) {
            var _msg = "蓝色方赢了";
            MessageBox.show(_msg, MessageBox.OK);
            status = WinOrLoseEnum.BlackWin;
        }
        if (status != WinOrLoseEnum.NotEndYet) {
            this.GameState = CommonDefine.GameStateEnum.GameEnd;
        }
        return status;
    },
    ShowMessage: function ShowMessage(msg) {
        this.Notice.string = msg;
        // let messageText = cc.instantiate(this.MessageTextPrefab);
        // messageText.parent = this.node;
        // messageText.getComponent('MessageText').setMsg(msg,3);
    },
    OnRuleBtnClick: function OnRuleBtnClick() {
        var rule = cc.instantiate(this.RulePrefab);
        rule.parent = this.node;
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
        //# sourceMappingURL=GameScene.js.map
        