const websocket = require("websocket");
const THREE_CHESS_SERVICE = 3;
const BoardWidth = 500;
const CHESS_WIDTH = BoardWidth/6;
const PressOffset = 12;
const CENTER = 3;//中心那个点
const DISK_SIZE = 7;


const WinOrLoseEnum = {
    NotEndYet:0,
    BlackWin:1,
    WhiteWin:2,
};

cc.Class({
    extends: cc.Component,

    properties: {
        ChessPrefab:cc.Prefab,
        MessageTextPrefab:cc.Prefab,
        RulePrefab:cc.Prefab,
        MessageBoxPref:cc.Prefab,
        Board:cc.Node,
        _gameState:0,
        GameState:{
            get(){
                return this._gameState;
            },
            set(value){
                this._gameState = value;
            }
        },
        IsBlackTurn:{
            get(){
                return this.cur_svr_id == this.button_id;
            }
        },
        ThreeTypeCount:0,
        ChessNodes:
        {
            default:[],
            visible:false,
        },
        MakeThreesPoints:
        {
            default:[],
            visible:false,
        },
        NewChess:
        {
            default:null,
            visible:false,
        },
        Notice:cc.Label,
        ColorStr:{
            get(){
                if(this.IsBlackTurn)
                {
                    return "黑色";
                }else{
                    return "白色";
                }
            }
        },
        TurnNoticeStr:{
            get()
            {
                return "轮到"+ this.ColorStr +"走棋";
            }
        },
        svr_seatid:-1,
        ChessSprite:[cc.SpriteFrame],
        first_to_move_state:false,
        StartButton:cc.Button,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.Board.on(cc.Node.EventType.TOUCH_START, this.onTouchBoard, this);
        this.Board.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        window.GameController = this;
        window.MessageBoxPref = this.MessageBoxPref;

        var services_handlers = {
            3: this.on_game_service_entry.bind(this),
        };
        websocket.register_cmd_handler(services_handlers); 

        this.seat_a = cc.find("Canvas/UI_ROOT/seat_a");
        this.seat_a.active = false;
        
        this.seat_b = cc.find("Canvas/UI_ROOT/seat_b");
        this.seat_b.active = false;

        this.seat_a_chess = this.seat_a.getChildByName("chess");
        this.seat_b_chess = this.seat_b.getChildByName("chess");

        this.checkout = cc.find("Canvas/UI_ROOT/game_end");
        this.checkout.active = false;

        this.button_id = -1;
        this.cur_svr_id = -1;
        this.svr_seatid = -1;
    },
    
    ResetGame()
    {
        this.ChessPoints = [[ 0,-1,-1, 0,-1,-1, 0],
                            [-1, 0,-1, 0,-1, 0,-1],
                            [-1,-1, 0, 0, 0,-1,-1],
                            [ 0, 0, 0,-1, 0, 0, 0],
                            [-1,-1, 0, 0, 0,-1,-1],
                            [-1, 0,-1, 0,-1, 0,-1],
                            [ 0,-1,-1, 0,-1,-1, 0]];

        this.Board.removeAllChildren();
        if(this.ChessNodes.length >0)
        {
            this.ChessNodes.forEach(node=>{
                node.destroy();
            })
        }
        this.ChessNodes = [];
        this.CurrChess = null;
        
        this.first_to_move_state = false;
    },
    
    StartButtonClick()
    {
        // return;
        // 客户端发送一个数据请求到服务器
        var req_data = {
            0: THREE_CHESS_SERVICE, // 服务类型;
            1: CommonDefine.CMDTypeEnum.SITDOWN, // 操作命令; // SITDOWN
            
            // .... 用户的数据;
        };
        // end 
        websocket.send_object(req_data); 
    },
    test(){
        MessageBox.show("赢了",MessageBox.OK)
    },
    seat_turn_to_player(svr_seatid)
    {
        if (this.svr_seatid == svr_seatid) {
            this.seat_a.getChildByName("time_bar").active = true;
            this.seat_b.getChildByName("time_bar").active = false;
            this.seat_a_chess.getComponent(cc.Animation).play();
            this.seat_b_chess.getComponent(cc.Animation).stop();
            this.seat_b_chess.opacity = 255;
        }
        else {
            this.seat_a.getChildByName("time_bar").active = false;
            this.seat_b.getChildByName("time_bar").active = true;
            this.seat_a_chess.getComponent(cc.Animation).stop();
            this.seat_b_chess.getComponent(cc.Animation).play();
            this.seat_a_chess.opacity = 255;
        }
    },

    sitdown(cmd)
    {
        if (cmd[2] != 1) { // status != OK
            console.log("######sit down error", cmd);
            return;
        }
        this.svr_seatid = cmd[3];
        //本方座位要显示出来
        this.seat_a.active = true;
        this.seat_a.getChildByName("chess").getComponent(cc.Sprite).spriteFrame = this.ChessSprite[this.svr_seatid];
        this.StartButton.interactable = false;
    },

    // 服务器主动发送，没有状态码
    user_arrived(cmd)
    {
        var svr_seatid = cmd[2];
        console.log("######sv_seatid is arrived", svr_seatid);
        this.seat_b.active = true;
        this.seat_b.getChildByName("chess").getComponent(cc.Sprite).spriteFrame = this.ChessSprite[svr_seatid];
    },
    user_standup: function(cmd) {
        if (cmd[2] != 1) { // 
            console.log("######user_standup error", cmd);
            return;
        }
        var sv_seatid = cmd[3];
        if (sv_seatid == this.sv_seatid) { // 自己站起来
            this.seat_a.active = false;
            this.seat_b.active = false;
        }
        else { // 其它的玩家站起
            this.seat_b.active = false;
        }
    },
    game_started(cmd)
    {
        this.ResetGame();
        this.button_id = cmd[2];
        this.cur_svr_id = -1;

        // 指示那个先下，
        // end 
        
        // 播放开始动画
        // end 
        
        // 把上一局的棋子清理掉
        // this.chess_disk.removeAllChildren();
        // end 
    },
    turn_to_player(cmd)
    {
        var svr_seatid = cmd[2];
        this.seat_turn_to_player(svr_seatid);
        this.cur_svr_id = svr_seatid;
    },
    player_put_chess(cmd)
    {
        if (cmd[2] != 1) { //  非法操作,OK
            console.log("######player_put_chess error", cmd);
            return;
        }
        var gameStatus = cmd[3];
        switch(gameStatus)
        {
            case CommonDefine.GameStateEnum.DropChess:
            {
                var block_x = cmd[5];
                var block_y = cmd[6];
                this.give_chess_at(block_x, block_y);
            }
            break;
            case CommonDefine.GameStateEnum.PressChess:
            {
                var sv_seatid = cmd[4];
                var block_x = cmd[5];
                var block_y = cmd[6];
                let pt2 = cc.v2(block_x, block_y);
                this.ChessPoints[pt2.x][pt2.y] = CommonDefine.PointTypeEnum.DoubleChess;
                for(let i=0;i<this.ChessNodes.length;i++)
                {
                    let chess = this.ChessNodes[i];
                    let tempPt = chess.getComponent('Chess').Point;
                    if(tempPt.x == pt2.x && tempPt.y == pt2.y)
                    {
                        let pressChess = cc.instantiate(this.ChessPrefab);
                        pressChess.parent = this.Board;
                        pressChess.getComponent('Chess').Point = pt2;
                        pressChess.getComponent('Chess').InitChess(this.IsBlackTurn,false);
                        pressChess.position = this.Point2Position(pt2);
                        if(pt2.x == 3)
                        {
                            pressChess.y += PressOffset;
                            chess.y -=PressOffset;
                        }
                        else{
                            pressChess.x += PressOffset;
                            chess.x -=PressOffset;
                        }
                        
                        this.ChessNodes.push(pressChess);
                        break;
                    }
                }
            }
            break;
            case CommonDefine.GameStateEnum.MoveChess:
            {
                let step = cmd[4];
                switch(step)
                {
                    case CommonDefine.MoveStepEnum.SELECT_CHESS:
                    {
                        let select_pt = cc.v2(cmd[5],cmd[6]);
                        if(this.CurrChess != null)
                        {
                            this.CurrChess.IsCurrentFlag = false;
                        }
                        for(let i=0;i<this.ChessNodes.length;i++)
                        {
                            let chess_i = this.ChessNodes[i].getComponent('Chess');
                            if(chess_i.Point.x == select_pt.x && chess_i.Point.y == select_pt.y)
                            {
                                chess_i.IsCurrentFlag = true;
                                this.CurrChess = chess_i;
                                break;
                            }
                        }
                        break;
                    }
                    case CommonDefine.MoveStepEnum.DO_MOVE:
                    {
                        let from_pt = cc.v2(cmd[5],cmd[6]);
                        let to_point = cc.v2(cmd[7],cmd[8]);
                        let centerPos = this.Point2Position(to_point);
                        if(!this.CurrChess)
                        {
                            console.error("当前没有选中棋子");
                            break;
                        }
                        this.CurrChess.node.runAction(cc.moveTo(0.3,centerPos));
                        this.CurrChess.Point = to_point;
                        this.ChessPoints[to_point.x][to_point.y] = this.ChessPoints[from_pt.x][from_pt.y];
                        this.ChessPoints[from_pt.x][from_pt.y] = CommonDefine.PointTypeEnum.Empty;
                        break;
                    } 
                }
                
                break;
            }
            case CommonDefine.GameStateEnum.EatChess:
            {
                var sv_seatid = cmd[4];
                var block_x = cmd[5];
                var block_y = cmd[6];
                let pt2 = cc.v2(block_x, block_y);
                this.ChessPoints[pt2.x][pt2.y] = CommonDefine.PointTypeEnum.Empty;
                for(let i=0;i<this.ChessNodes.length;i++)
                {
                    let chess = this.ChessNodes[i];
                    let tempPt = chess.getComponent('Chess').Point;
                    if(tempPt.x == pt2.x && tempPt.y == pt2.y)
                    {
                        this.ChessNodes.delete(chess);
                        chess.destroy();
                    }
                }
                break;
            }
            default:
                break;
        }
        
    },
    change_game_status(cmd)
    {
        this.GameState = cmd[2];
        if(this.GameState == CommonDefine.GameStateEnum.MoveChess && !this.first_to_move_state)
        {
            let msg = "移子阶段白子先动棋";
            this.ShowMessage(msg);
            this.first_to_move_state = true;
            if(this.CurrChess != null)
            {
                this.CurrChess.IsCurrentFlag = false;
                this.CurrChess = null;
            }
        }
    },
    make_three(cmd)
    {
        console.log("成三了:",cmd);
        this.ThreeTypeCount = cmd[2];
        let chess_count = cmd[3];
        for(let i=0;i<chess_count;i++)
        {
            let intNum = cmd[4 + i];
            let x = Math.floor(intNum/10);
            let y = intNum % 10;
            let pt = cc.v2(x,y);
            this.MakeThreesPoints.push(pt);
        }
        if(this.MakeThreesPoints.length>0)
        {
            this.enableMakeThreeAnimation(true);
        }
        if(this.svr_seatid == this.cur_svr_id)
        {
            let msg = "你形成了"+ this.ThreeTypeCount + "个三子,可以吃掉对方"+this.ThreeTypeCount+"个棋子";
            this.ShowMessage(msg);
        }
    },
    notify_three_count(cmd)
    {
        this.ThreeTypeCount = cmd[2];
        if(this.svr_seatid == this.cur_svr_id && this.ThreeTypeCount > 0)
        {
            let msg = "你还可以吃掉对方"+this.ThreeTypeCount+"个棋子";
            this.ShowMessage(msg);
        }else{
            if(this.MakeThreesPoints.length>0)
            {
                this.enableMakeThreeAnimation(false);
                this.MakeThreesPoints = [];
            }
            if(this.CurrChess != null)
            {
                this.CurrChess.IsCurrentFlag=false;
            }
        }
    },
    clear_press_chesses(cmd)
    {
        console.log("清理压着的子:",cmd);
        let count = cmd[2];
        for(let i=0;i<count;i++)
        {
            let intNum = cmd[3+i];
            let block_x = Math.floor(intNum/10);
            let block_y = intNum % 10;
            this.ChessPoints[block_x][block_y] = CommonDefine.PointTypeEnum.Empty;
            for(let j=0;j<this.ChessNodes.length;j++)
            {
                let chess = this.ChessNodes[j];
                if(chess.getComponent('Chess').Point.x == block_x && chess.getComponent('Chess').Point.y == block_y)
                {
                    this.ChessNodes.delete(chess);
                    chess.destroy();
                }
            }
        }
    },
    checkout_game(cmd)
    {
        var winner = cmd[2];
        if (winner == this.svr_seatid) { // 等于自己,播放胜利动画
            this.checkout.active = true;
            this.scheduleOnce(function() {
                this.checkout.active = false;
            }.bind(this), 5);
        }
        else { // 播放失败动画
            let msg = "你输了。。。";
            this.ShowMessage(msg);
        }
        this.StartButton.interactable = true;
    },
    on_game_service_entry: function(cmd) {
        var opt_type = cmd[1];
        switch(opt_type) {
            case CommonDefine.CMDTypeEnum.SITDOWN: // SITDOWN
                this.sitdown(cmd);
            break;
            case CommonDefine.CMDTypeEnum.USER_ARRIVED: // USERARRIVE
            {
                this.user_arrived(cmd);
            }
            break;
            case CommonDefine.CMDTypeEnum.STANDUP: // USERSTANDUP
            {
                this.user_standup(cmd);
            }
            break;
            case CommonDefine.CMDTypeEnum.GAME_START: // GAME_START, 表示游戏开始了。
            {
                this.game_started(cmd);
            }
            break;
            case CommonDefine.CMDTypeEnum.TURN_TO_PLAYER: // 轮到某个玩家,
            {
                this.turn_to_player(cmd);
            }
            break;
            case CommonDefine.CMDTypeEnum.PUT_CHESS:
            {
                this.player_put_chess(cmd);
            }
            break;
            case CommonDefine.CMDTypeEnum.GAME_STATUS: // 
            {
                this.change_game_status(cmd);
            }
            break;
            case CommonDefine.CMDTypeEnum.MAKE_THREE: 
            {
                this.make_three(cmd);
            }
            break;
            case CommonDefine.CMDTypeEnum.THREE_COUNT:
            {
                this.notify_three_count(cmd);
            }
            break;
            case CommonDefine.CMDTypeEnum.CLEAR_DOUBLE:
            {
                this.clear_press_chesses(cmd);
            }
            break;
            case CommonDefine.CMDTypeEnum.CHECKOUT: // 游戏结束
            {
                this.checkout_game(cmd);
            }
            break;
            case CommonDefine.CMDTypeEnum.USER_QUIT: // USER_QUIT
            {
                // 6秒以后清空牌局，等待重新点击进入
                this.scheduleOnce(function(){
                    this.seat_a.active = false;
                    this.seat_b.active = false;
                    this.checkout.active = false;
                    this.ResetGame();
                }.bind(this), 6);
            }
            break;
        }
    }, 
    
    
    Point2Position(pt)
    {
        //棋盘上某个交叉点的坐标为: 
        //x坐标=(交叉点的列索引-3)*CHESS_WIDTH,
        //y坐标=(3-交叉点的行索引)*CHESS_WIDTH
        let pos = cc.v2((pt.y-3)*CHESS_WIDTH,(3-pt.x)*CHESS_WIDTH);
        return pos;
    },
   
    onTouchBoard(event){
        if(this.GameState == CommonDefine.GameStateEnum.None)
        {
            return;
        }
    },
    onTouchEnd(event)
    {
        if(this.GameState != CommonDefine.GameStateEnum.DropChess && 
            this.GameState != CommonDefine.GameStateEnum.PressChess &&
            this.GameState != CommonDefine.GameStateEnum.MoveChess)
        {
            return;
        }
        if(this.svr_seatid != this.cur_svr_id)
        {
            console.log("not your turn");
            return;
        }
        let pos = event.getLocation();
        const worldPos = this.node.parent.convertToWorldSpaceAR(pos);
        const localPos = this.Board.convertToNodeSpaceAR(worldPos);
        //落子状态
        if(this.GameState == CommonDefine.GameStateEnum.DropChess)
        {
            //落子
            let pt = this.CheckPosInPoint(localPos,CommonDefine.PointTypeEnum.Empty);
            if(pt != null)
            {
                //发送下子请求
                let req_data = {
                    0:THREE_CHESS_SERVICE,
                    1:CommonDefine.CMDTypeEnum.PUT_CHESS,
                    2:CommonDefine.GameStateEnum.DropChess,
                    3:pt.x,
                    4:pt.y,
                };
                console.log("send dropchess point.x=",pt.x,",point.y=",pt.y);
                websocket.send_object(req_data); 
            }
            
            return;
        }
        //压子状态
        else if(this.GameState == CommonDefine.GameStateEnum.PressChess)
        {
            if(this.ThreeTypeCount>0)
            {
                let type = this.IsBlackTurn ? CommonDefine.PointTypeEnum.WhiteChess : CommonDefine.PointTypeEnum.BlackChess;
                let pt2 = this.CheckPosInPoint(localPos,type);
                if(pt2 != null)
                {

                    let req_data = {
                        0:THREE_CHESS_SERVICE,
                        1:CommonDefine.CMDTypeEnum.PUT_CHESS,
                        2:CommonDefine.GameStateEnum.PressChess,
                        3:pt2.x,
                        4:pt2.y,
                    };
                    websocket.send_object(req_data); 
                }
                return;
            }
        }
        else if(this.GameState == CommonDefine.GameStateEnum.MoveChess)
        {
            let to_point = this.CheckPosInPoint(localPos,CommonDefine.PointTypeEnum.Empty);
            if(to_point != null)//坐标点落在某个棋盘点上且该棋盘点上无子
            {
                if(this.CurrChess == null)
                {
                    console.log("移子操作错误,this.CurrChess == null");
                    return;
                }
                let req_data = {
                    0:THREE_CHESS_SERVICE,
                    1:CommonDefine.CMDTypeEnum.PUT_CHESS,
                    2:CommonDefine.GameStateEnum.MoveChess,
                    3:CommonDefine.MoveStepEnum.DO_MOVE,
                    4:this.CurrChess.Point.x,
                    5:this.CurrChess.Point.y,
                    6:to_point.x,
                    7:to_point.y,
                };
                websocket.send_object(req_data); 
                return;
            }
        }
    },
    SelectChess(point)
    {
        let req_data = {
            0:THREE_CHESS_SERVICE,
            1:CommonDefine.CMDTypeEnum.PUT_CHESS,
            2:CommonDefine.GameStateEnum.MoveChess,
            3:CommonDefine.MoveStepEnum.SELECT_CHESS,
            4:point.x,
            5:point.y,
        };
        websocket.send_object(req_data); 
    },
    give_chess_at(block_x, block_y)
    {
        let pt = cc.v2(block_x,block_y);
        let chess = cc.instantiate(this.ChessPrefab);
        chess.parent = this.Board;
        let pos = this.Point2Position(pt);
        chess.position = pos;

        chess.getComponent('Chess').InitChess(this.IsBlackTurn,true);
        chess.getComponent('Chess').Point = pt;
        this.ChessNodes.push(chess);
        this.ChessPoints[pt.x][pt.y] = this.IsBlackTurn ? CommonDefine.PointTypeEnum.BlackChess : CommonDefine.PointTypeEnum.WhiteChess;
        
        if(this.CurrChess != null)
        {
            this.CurrChess.IsCurrentFlag=false;
        }
        this.CurrChess = chess.getComponent('Chess');
    },
    CheckPosInPoint(pressPos,needPointType){
        let pt = null;
        //console.log("CheckPosInPoint,pressPos=",pressPos);
        for(let i=0;i<DISK_SIZE;i++)
        {
            for(let j=0;j<DISK_SIZE;j++)
            {
                let ptValue = this.ChessPoints[i][j];
                if(ptValue == needPointType)
                {
                    let ptPos = this.Point2Position(cc.v2(i,j));
                    //判断触摸点是否在棋盘某个交叉点上
                    //console.log("x=",i,",y=",j);
                    if((Math.abs(ptPos.x - pressPos.x) <= CHESS_WIDTH/2) && (Math.abs(ptPos.y - pressPos.y) <= CHESS_WIDTH/2))
                    {
                        pt = cc.v2(i,j);
                        //console.log(this.ChessPoints);
                        return pt;
                    }
                }
            }
        }
        return null;
    },
    
  
    enableMakeThreeAnimation(isEnable)
    {
        console.log("this.MakeThreesPoints=",this.MakeThreesPoints);
        if(!this.MakeThreesPoints || this.MakeThreesPoints.length <=0)
        {
            return;
        }
        this.MakeThreesPoints.forEach(pt=>{
            this.ChessNodes.forEach(node=>{
                let chess = node.getComponent('Chess');
                if(chess.Point.x == pt.x && chess.Point.y == pt.y)
                {
                    if(isEnable)
                    {
                        chess.Flash();
                    }else{
                        chess.StopFlash();
                    }
                    
                }
            })
        });
    },
    
    IsBoardFull()
    {
        for(let i=0;i<this.ChessPoints.length;i++)
        {
            for(let j=0;j<this.ChessPoints[i].length;j++)
            {
                let ptValue = this.ChessPoints[i][j];
                if(ptValue == 1)
                {
                    return false;
                }
            }
        }
        return true;
    },
    EatChess(chessNode){
        if(this.GameState != CommonDefine.GameStateEnum.EatChess)
        {
            return;
        }
        let point = chessNode.getComponent('Chess').Point;
        if(point != null)
        {
            let req_data = {
                0:THREE_CHESS_SERVICE,
                1:CommonDefine.CMDTypeEnum.PUT_CHESS,
                2:CommonDefine.GameStateEnum.EatChess,
                3:point.x,
                4:point.y,
            };
            websocket.send_object(req_data);   
        }
        return;
    },
    JudgeWin()
    {
        let blackCount = 0;
        let wihteCount = 0;
        this.ChessNodes.forEach(node=>{
            let chess = node.getComponent('Chess');
            if(chess.IsBlack){
                blackCount++;
            }else{
                wihteCount++
            }
        });
        let status = WinOrLoseEnum.NotEndYet;
        if(blackCount <= 2)
        {
            let msg = "橙色方赢了";
            MessageBox.show(msg,MessageBox.OK)
            status = WinOrLoseEnum.WhiteWin;
        }
        else if(wihteCount <= 2)
        {
            let msg = "蓝色方赢了";
            MessageBox.show(msg,MessageBox.OK)
            status = WinOrLoseEnum.BlackWin;
        }
        if(status != WinOrLoseEnum.NotEndYet)
        {
            this.GameState = CommonDefine.GameStateEnum.GameEnd;
        }
        return status;
    },
    ShowMessage(msg)
    {
        //this.Notice.string = msg;
        let messageText = cc.instantiate(this.MessageTextPrefab);
        messageText.parent = this.node;
        messageText.getComponent('MessageText').setMsg(msg,2);
    },

    OnRuleBtnClick()
    {
        let rule = cc.instantiate(this.RulePrefab);
        rule.parent = this.node;
    }

});
