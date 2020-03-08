import { networkInterfaces } from "os";

var CommonDefine = {};

CommonDefine.GameStateEnum = {
    None:0,
    DropChess:1,
    PressChess:2,
    MoveChess:3,
    EatChess:4,
    End:5,
};

CommonDefine.PointTypeEnum = {
    Invalid:-1,
    Empty:0,
    BlackChess:1,
    WhiteChess:2,
    DoubleChess:3,
};

CommonDefine.SERVICEEnum = {
    FIVE_CHESS_SERVICE:2,
    THREE_CHESS_SERVICE:3
},

CommonDefine.CMDTypeEnum = {
    SITDOWN: 1, // 玩家坐下命令
	USER_ARRIVED: 2, // 有玩家进来; 
	STANDUP: 3, // 玩家站起;
	GAME_START: 4, // 游戏开始;
    TURN_TO_PLAYER: 5, // 轮到哪个玩家;
    PUT_CHESS:6,
    GAME_STATUS: 7, // 切换游戏状态
    MAKE_THREE:8,
    THREE_COUNT:9, //成三个数
    CLEAR_DOUBLE:10, //清理压着的子
	CHECKOUT: 11, // 结算
	USER_QUIT: 12, // 用户离开
},

CommonDefine.GameStateEnum = {
    None:0,
    DropChess:1,
    PressChess:2,
    MoveChess:3,
    EatChess:4,
    GameEnd:5,
};

CommonDefine.DropSubCMDEnum = {
    NONE:0,
    MAKE_THREE:1,
}

CommonDefine.MoveStepEnum = {
    SELECT_CHESS:0,
    DO_MOVE:1,
}

window.CommonDefine = CommonDefine;