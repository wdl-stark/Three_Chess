const BoardWidth = 500;
const width = BoardWidth/6;
const CENTER = 3;//中心那个点
const GameStateEnum = {
    None:0,
    DropChess:1,
    PressChess:2,
    MoveChess:3,
    EatChess:4,
    GameEnd:5,
};

const PointTypeEnum = {
    Invalid:0,
    Empty:1,
    BlackChess:2,
    WhiteChess:3,
    DoubleChess:4,
};

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
        IsBlackTurn:true,
        ThreeTypeCount:0,
        ChessNodes:
        {
            default:[],
            visible:false,
        },
        HighLightThreePoints:
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
                    return "蓝色";
                }else{
                    return "橙色";
                }
            }
        },
        TurnNoticeStr:{
            get()
            {
                return "轮到"+ this.ColorStr +"走棋";
            }
        }
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.Board.on(cc.Node.EventType.TOUCH_START, this.onTouchBoard, this);
        this.Board.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        window.GameController = this;
        window.MessageBoxPref = this.MessageBoxPref;
        this.StartGame();

    },
    
    StartGame()
    {
        this.ChessPoints = [[1,0,0,1,0,0,1],
                            [0,1,0,1,0,1,0],
                            [0,0,1,1,1,0,0],
                            [1,1,1,0,1,1,1],
                            [0,0,1,1,1,0,0],
                            [0,1,0,1,0,1,0],
                            [1,0,0,1,0,0,1]];
        this.ThreePointsMap = new Map();
        this.PointsCanMovies = new Map();//每个点的所有走法
        for(let i=0;i<this.ChessPoints.length;i++)
        {
            let line = this.ChessPoints[i];
            for(let j=0;j<line.length;j++)
            {
                let ptValue = line[j];
                if(ptValue != 1)
                {
                    continue;
                }
                let pt = cc.v2(i,j);
                if(i==0 || i==6)//第0,6行
                {
                    if(j==0 || j==6)
                    {
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
                        let rowOffset = i==0 ? 1 : -1;
                        let colOffset = j==0 ? 1 : -1;
                        let oneLine = [];
                        let lines = [];
                        //横
                        oneLine.push(cc.v2(i,3));
                        oneLine.push(cc.v2(i,CENTER+3*colOffset));
                        lines.push(oneLine);
                        
                        //竖
                        oneLine = [];
                        oneLine.push(cc.v2(3,j));
                        oneLine.push(cc.v2(CENTER+3*rowOffset,j));
                        lines.push(oneLine);
                        
                        //斜
                        oneLine = [];
                        oneLine.push(cc.v2(i+1*rowOffset,j+1*colOffset));
                        oneLine.push(cc.v2(i+2*rowOffset,j+2*colOffset));
                        lines.push(oneLine);

                        this.ThreePointsMap.set(pt,lines);

                        //每个点的所有走法
                        let moveis = [];
                        rowOffset = i == 0 ? 1 : -1;
                        colOffset = j == 0 ? 1 : -1;
                        moveis.push(cc.v2(i,3));
                        moveis.push(cc.v2(3,j));
                        moveis.push(cc.v2(i+1*rowOffset,j+1*colOffset));
                        this.PointsCanMovies.set(pt,moveis);
                    }else if(j==3)
                    {
                        //第(0,3),(6,3)点
                        let rowOffset = i==0 ? 1 : -1;
                        let oneLine = [];
                        let lines = [];
                        //横
                        oneLine.push(cc.v2(i,0));
                        oneLine.push(cc.v2(i,6));
                        lines.push(oneLine);
                        //竖
                        oneLine = [];
                        oneLine.push(cc.v2(i+1*rowOffset,3));
                        oneLine.push(cc.v2(i+2*rowOffset,3));
                        lines.push(oneLine);
                        this.ThreePointsMap.set(pt,lines);

                        let moveis = [];
                        rowOffset = i == 0 ? 1 : -1;
                        moveis.push(cc.v2(i,0));
                        moveis.push(cc.v2(i,6));
                        moveis.push(cc.v2(i+1*rowOffset,3));
                        this.PointsCanMovies.set(pt,moveis);
                    }
                }
                else if(i==1 || i==5)//第1,5行
                {
                    if(j==1 || j==5)
                    {
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
                        let rowOffset = i == 1 ? 1 : -1;
                        let colOffset = j == 1 ? 1 : -1;
                        //横
                        let oneLine = [];
                        let lines = [];
                        oneLine.push(cc.v2(i,3));
                        oneLine.push(cc.v2(i,3+2*colOffset));
                        lines.push(oneLine);
                        //竖
                        oneLine = [];
                        oneLine.push(cc.v2(3,j));
                        oneLine.push(cc.v2(3+2*rowOffset,j));
                        lines.push(oneLine);
                        //斜
                        oneLine = [];
                        rowOffset = i == 1 ? 1 : -1;
                        colOffset = j == 1 ? 1 : -1;
                        oneLine.push(cc.v2(i+1*rowOffset,j+1*colOffset));
                        oneLine.push(cc.v2(i-1*rowOffset,j-1*colOffset));
                        lines.push(oneLine);
                        this.ThreePointsMap.set(pt,lines);

                        let moveis = [];
                        rowOffset = i == 1 ? 1 : -1;
                        colOffset = j == 1 ? 1 : -1;
                        moveis.push(cc.v2(i,3));
                        moveis.push(cc.v2(3,j));
                        moveis.push(cc.v2(i+1*rowOffset,j+1*colOffset));
                        rowOffset = i == 1 ? -1 : 1;
                        colOffset = j == 1 ? -1 : 1;
                        moveis.push(cc.v2(i+1*rowOffset,j+1*colOffset));
                        this.PointsCanMovies.set(pt,moveis);
                    }else if(j==3)
                    {
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
                        let oneLine = [];
                        let lines = [];
                        oneLine.push(cc.v2(i,1));
                        oneLine.push(cc.v2(i,5));
                        lines.push(oneLine);
                        //竖
                        oneLine = [];
                        oneLine.push(cc.v2(i-1,3));
                        oneLine.push(cc.v2(i+1,3));
                        lines.push(oneLine);
                        this.ThreePointsMap.set(pt,lines);

                        let moveis = [];
                        moveis.push(cc.v2(i,1));
                        moveis.push(cc.v2(i,5));
                        moveis.push(cc.v2(i+1,3));
                        moveis.push(cc.v2(i-1,3));
                        this.PointsCanMovies.set(pt,moveis);
                    }
                }
                else if(i==2 || i==4)
                {
                    if(j==2 || j==4)
                    {
                        /*
                            [1,0,0,1,0,0,1],
                            [0,1,0,1,0,1,0],
                            [0,0,2,1,2,0,0],
                            [1,1,1,0,1,1,1],
                            [0,0,2,1,2,0,0],
                            [0,1,0,1,0,1,0],
                            [1,0,0,1,0,0,1];
                        */ 
                        let rowOffset = i == 2 ? 1 : -1;
                        let colOffset = j == 2 ? 1 : -1;
                        //横
                        let oneLine = [];
                        let lines = [];
                        oneLine.push(cc.v2(i,3));
                        oneLine.push(cc.v2(i,3+1*colOffset));
                        lines.push(oneLine);
                        //竖
                        oneLine = [];
                        oneLine.push(cc.v2(i+1*rowOffset,j));
                        oneLine.push(cc.v2(i+2*rowOffset,j));
                        lines.push(oneLine);
                        //斜
                        oneLine = [];
                        rowOffset = i == 2 ? -1 : 1;
                        colOffset = j == 2 ? -1 : 1;
                        oneLine.push(cc.v2(i+1*rowOffset,j+1*colOffset));
                        oneLine.push(cc.v2(i+2*rowOffset,j+2*colOffset));
                        lines.push(oneLine);
                        this.ThreePointsMap.set(pt,lines);

                        //每个点的所有走法
                        let moveis = [];
                        rowOffset = i == 2 ? -1 : 1;
                        colOffset = j == 2 ? -1 : 1;
                        moveis.push(cc.v2(i,3));
                        moveis.push(cc.v2(3,j));
                        moveis.push(cc.v2(i+1*rowOffset,j+1*colOffset));
                        this.PointsCanMovies.set(pt,moveis);
                    }
                    else if(j==3)
                    {
                        
                        let rowOffset = i == 2 ? -1 : 1;
                        //横
                        let oneLine = [];
                        let lines = [];
                        oneLine.push(cc.v2(i,2));
                        oneLine.push(cc.v2(i,4));
                        lines.push(oneLine);
                        //竖
                        oneLine = [];
                        oneLine.push(cc.v2(i+1*rowOffset,3));
                        oneLine.push(cc.v2(i+2*rowOffset,3));
                        lines.push(oneLine);
                        this.ThreePointsMap.set(pt,lines);

                        //每个点的所有走法
                        let moveis = [];
                        rowOffset = i == 2 ? -1 : 1;
                        moveis.push(cc.v2(i,2));
                        moveis.push(cc.v2(i,4));
                        moveis.push(cc.v2(i+1*rowOffset,3));
                        this.PointsCanMovies.set(pt,moveis);
                    }
                }
                else if(i==3)
                {
                    if(j==0 || j==6)
                    {
                        let colOffset = j == 0 ? 1 : -1;
                        //横
                        let oneLine = [];
                        let lines = [];
                        oneLine.push(cc.v2(3,j+1*colOffset));
                        oneLine.push(cc.v2(3,j+2*colOffset));
                        lines.push(oneLine);
                        //竖
                        oneLine = [];
                        oneLine.push(cc.v2(0,j));
                        oneLine.push(cc.v2(6,j));
                        lines.push(oneLine);
                        this.ThreePointsMap.set(pt,lines);

                        //每个点的所有走法
                        let moveis = [];
                        colOffset = j == 0 ? 1 : -1;
                        moveis.push(cc.v2(0,j));
                        moveis.push(cc.v2(6,j));
                        moveis.push(cc.v2(3,j+1*colOffset));
                        this.PointsCanMovies.set(pt,moveis);
                    }else if(j==1 || j==5)
                    {
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
                        let oneLine = [];
                        let lines = [];
                        oneLine.push(cc.v2(3,j-1));
                        oneLine.push(cc.v2(3,j+1));
                        lines.push(oneLine);
                        //竖
                        oneLine = [];
                        oneLine.push(cc.v2(1,j));
                        oneLine.push(cc.v2(5,j));
                        lines.push(oneLine);
                        this.ThreePointsMap.set(pt,lines);

                        //每个点的所有走法
                        let moveis = [];
                        moveis.push(cc.v2(3,j-1));
                        moveis.push(cc.v2(3,j+1));
                        moveis.push(cc.v2(i-2,j));
                        moveis.push(cc.v2(i+2,j));
                        this.PointsCanMovies.set(pt,moveis);
                    }else if(j==2 || j==4)
                    {
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
                        let colOffset = j==2 ? -1 : 1;
                        let oneLine = [];
                        let lines = [];
                        oneLine.push(cc.v2(3,j+1*colOffset));
                        oneLine.push(cc.v2(3,j+2*colOffset));
                        lines.push(oneLine);
                        //竖
                        oneLine = [];
                        oneLine.push(cc.v2(2,j));
                        oneLine.push(cc.v2(4,j));
                        lines.push(oneLine);
                        this.ThreePointsMap.set(pt,lines);

                         //每个点的所有走法
                         let moveis = [];
                         colOffset = j == 2 ? -1 : 1;
                         moveis.push(cc.v2(3,j+1*colOffset));
                         moveis.push(cc.v2(i-1,j));
                         moveis.push(cc.v2(i+1,j));
                         this.PointsCanMovies.set(pt,moveis);
                    }
                }
            }
        }

        console.log("所有点的成三点",this.ThreePointsMap);
        console.log("点的所有可移动点",this.PointsCanMovies);
        //console.log(this.ThreePointsMap);
        this.ResetGame();
        this.GameState = GameStateEnum.DropChess;

        this.ShowMessage(this.TurnNoticeStr);
    },
    ResetGame()
    {
        if(this.ChessNodes.length >0)
        {
            this.ChessNodes.forEach(node=>{
                node.destroy();
            })
        }
        this.ChessNodes = [];
        this.NewChess = null;
    },
    StartButtonClick()
    {
        this.StartGame();
    },
    test(){
        MessageBox.show("蓝色赢了",MessageBox.OK)
    },
    Point2Position(pt)
    {
        //棋盘上某个交叉点的坐标为: 
        //x坐标=(交叉点的列索引-3)*width,
        //y坐标=(3-交叉点的行索引)*width
        let pos = cc.v2((pt.y-3)*width,(3-pt.x)*width);
        return pos;
    },
   
    onTouchBoard(event){
        if(this.GameState == GameStateEnum.None)
        {
            return;
        }
    },
    onTouchEnd(event)
    {
        if(this.GameState != GameStateEnum.DropChess && 
            this.GameState != GameStateEnum.PressChess &&
            this.GameState != GameStateEnum.MoveChess)
        {
            return;
        }
        let pos = event.getLocation();
        const worldPos = this.node.parent.convertToWorldSpaceAR(pos);
        const localPos = this.Board.convertToNodeSpaceAR(worldPos);
        //落子状态
        if(this.GameState == GameStateEnum.DropChess)
        {
            //落子
            let pt = this.CheckPosInPoint(localPos,PointTypeEnum.Empty);
            if(pt != null)
            {
                let chess = cc.instantiate(this.ChessPrefab);
                chess.parent = this.Board;
                let pos = this.Point2Position(pt);
                chess.position = pos;
                chess.getComponent('Chess').InitChess(this.IsBlackTurn,true);
                chess.getComponent('Chess').Point = pt;
                this.ChessNodes.push(chess);
                this.ChessPoints[pt.x][pt.y] = this.IsBlackTurn ? PointTypeEnum.BlackChess : PointTypeEnum.WhiteChess;
                
                if(this.NewChess != null)
                {
                    this.NewChess.IsCurrentFlag=false;
                }
                this.NewChess = chess.getComponent('Chess');


                this.CheckThree(pt);
                if(this.ThreeTypeCount > 0)//成三了
                {
                    this.GameState = GameStateEnum.PressChess;
                    
                }else{
                    this.IsBlackTurn = !this.IsBlackTurn;
                    this.ShowMessage(this.TurnNoticeStr);
                    this.CheckDropPhaseFinish();
                }
            }
            
            return;
        }
        //压子状态
        else if(this.GameState == GameStateEnum.PressChess)
        {
            if(this.ThreeTypeCount>0)
            {
                let type = this.IsBlackTurn ? PointTypeEnum.WhiteChess : PointTypeEnum.BlackChess;
                let pt2 = this.CheckPosInPoint(localPos,type);
                if(pt2 != null)
                {
                    this.ThreeTypeCount--;
                    this.ChessPoints[pt2.x][pt2.y] = PointTypeEnum.DoubleChess;
                    for(let i=0;i<this.ChessNodes.length;i++)
                    {
                        let chess = this.ChessNodes[i];
                        let tempPt = chess.getComponent('Chess').Point;
                        if(tempPt.x == pt2.x && tempPt.y == pt2.y)
                        {
                            let newChess = cc.instantiate(this.ChessPrefab);
                            newChess.parent = this.Board;
                            newChess.getComponent('Chess').Point = pt2;
                            newChess.getComponent('Chess').InitChess(this.IsBlackTurn,false);
                            newChess.position = this.Point2Position(pt2);
                            if(pt2.x == 3)
                            {
                                newChess.y += 8;
                                chess.y -=8;
                            }
                            else{
                                newChess.x += 8;
                                chess.x -=8;
                            }
                            
                            this.ChessNodes.push(newChess);
                            break;
                        }
                    }
                    if(this.ThreeTypeCount > 0)
                    {
                        let msg = this.ColorStr+"还可以吃对方"+this.ThreeTypeCount+"个子";
                        this.ShowMessage(msg);
                    }
                    
                }
                
            }
            if(this.ThreeTypeCount == 0)
            {
                if(this.HighLightThreePoints.length>0)
                {
                    this.HighLightChesses(false);
                    this.HighLightThreePoints = [];
                }
                if(this.NewChess != null)
                {
                    this.NewChess.IsCurrentFlag=false;
                }
                this.GameState = GameStateEnum.DropChess;
                this.IsBlackTurn = !this.IsBlackTurn;
                this.ShowMessage(this.TurnNoticeStr);
            }
            this.CheckDropPhaseFinish();
        }
        else if(this.GameState == GameStateEnum.MoveChess)
        {
            let point = this.CheckPosInPoint(localPos,CommonDefine.PointTypeEnum.Empty);
            if(point != null)//坐标点落在某个棋盘点上且该棋盘点上无子
            {
                let bCanMove = this.CheckCanMoveTo(this.NewChess.Point,point);
                if(bCanMove)//该棋盘点是当前棋子的合法行走点
                {
                    let centerPos = this.Point2Position(point);
                    this.NewChess.node.runAction(cc.moveTo(0.3,centerPos));
                    let prePt = cc.v2(this.NewChess.Point.x,this.NewChess.Point.y);
                    this.NewChess.Point = point;
                    this.AfterMoveTo(prePt,point);
                }
            }
        }

    },
    CheckPosInPoint(pressPos,needPointType){
        let pt = null;
        console.log("CheckPosInPoint,pressPos=",pressPos);
        for(let i=0;i<this.ChessPoints.length;i++)
        {
            let line = this.ChessPoints[i];
            for(let j=0;j<line.length;j++)
            {
                let ptValue = line[j];
                if(ptValue == needPointType)
                {
                    let ptPos = this.Point2Position(cc.v2(i,j));
                    //判断触摸点是否在棋盘某个交叉点上
                    console.log("x=",i,",y=",j);
                    if((Math.abs(ptPos.x - pressPos.x) <= width/2) && (Math.abs(ptPos.y - pressPos.y) <= width/2))
                    {
                        pt = cc.v2(i,j);
                        //console.log(this.ChessPoints);
                        return pt;
                    }
                }
            }
        }
        return pt;
    },
    CheckCanMoveTo(srcPoint, dstPoint)
    {
        let movies = null;
        this.PointsCanMovies.forEach((value,key)=>{
            if(srcPoint.x == key.x && srcPoint.y == key.y)
            {
                movies = value;
            }
        });
        if(movies==null || movies.length == 0)
        {
            return false;
        }
        for(let i=0;i<movies.length;i++)
        {
            if(movies[i].x == dstPoint.x && movies[i].y==dstPoint.y)
            {
                return true;
            }
        }
        return false;
    },
    AfterMoveTo(srcPoint,dstPoint)
    {
        this.ChessPoints[dstPoint.x][dstPoint.y] = this.ChessPoints[srcPoint.x][srcPoint.y];
        this.ChessPoints[srcPoint.x][srcPoint.y] = CommonDefine.PointTypeEnum.Empty;
        //判断走棋后是否成三
        let threeTypeCount = this.CheckThree(dstPoint);
        if(threeTypeCount > 0)
        {
            this.GameState = CommonDefine.GameStateEnum.EatChess;
        }else{
            this.IsBlackTurn = !this.IsBlackTurn;
        }
    },
    CheckThree(point)
    {
        let threeTypeCount = 0;
        this.ThreePointsMap.forEach((value, key)=>{
            if(point.x == key.x && point.y == key.y)
            {
                let lines = value;
                //检查该点的横，竖，斜线方向的点是否形成一个“三”
                lines.forEach(oneLine=>{
                    let sameChessNum = 0;
                    oneLine.forEach(pt=>{
                        let ptValue = this.ChessPoints[pt.x][pt.y];
                        //console.log("CheckThree pt.x=",pt.x,",pt.y=",pt.y);
                        if(ptValue == PointTypeEnum.BlackChess || 
                            ptValue == PointTypeEnum.WhiteChess)
                        {
                            if(ptValue == this.ChessPoints[point.x][point.y]){
                                sameChessNum++;
                            }
                        }
                    });
                    if(sameChessNum == oneLine.length)
                    {
                        threeTypeCount++;
                        oneLine.forEach(pt=>{
                            if(this.HighLightThreePoints.indexOf(pt) == -1)
                            {
                                this.HighLightThreePoints.push(pt);
                            }
                        });
                    }
                });
                
            }
        });
        
        if(this.HighLightThreePoints.length>0)
        {
            this.HighLightThreePoints.push(point);
            this.HighLightChesses(true);
        }
        this.ThreeTypeCount = threeTypeCount;
        if(threeTypeCount > 0)
        {
            let msg = this.ColorStr+"形成了"+ this.ThreeTypeCount + "个三子,可以吃掉对方"+this.ThreeTypeCount+"个棋子";
            this.ShowMessage(msg);
        } 
        return threeTypeCount;
    },
    HighLightChesses(isFlash)
    {
        if(!this.HighLightThreePoints || this.HighLightThreePoints.length <=0)
        {
            return;
        }
        this.HighLightThreePoints.forEach(pt=>{
            this.ChessNodes.forEach(node=>{
                let chess = node.getComponent('Chess');
                if(chess.Point.x == pt.x && chess.Point.y == pt.y)
                {
                    if(isFlash)
                    {
                        chess.Flash();
                    }else{
                        chess.StopFlash();
                    }
                    
                }
            })
        });
    },
    CheckDropPhaseFinish()
    {
        if(this.IsBoardFull())
        {
            for(let i=0;i<this.ChessPoints.length;i++)
            {
                for(let j=0;j<this.ChessPoints[i].length;j++)
                {
                    let ptValue = this.ChessPoints[i][j];
                    let point = cc.v2(i,j);
                    //删除成对的子
                    if(ptValue == 4)
                    {
                        this.ChessPoints[i][j] = 1;
                        for(let k=0;k<this.ChessNodes.length;k++)
                        {
                            let chess = this.ChessNodes[k];
                            let tempPt = chess.getComponent('Chess').Point;
                            if(tempPt.x == point.x && tempPt.y == point.y)
                            {
                                this.ChessNodes.delete(chess);
                                chess.destroy();
                            }
                        }
                    }
                }
            }
            this.GameState = GameStateEnum.MoveChess;
            this.IsBlackTurn = false;//摆棋阶段黑子先布子，则动子白子先动子
            this.ShowMessage(this.TurnNoticeStr);
        }
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
        let pt = chessNode.getComponent('Chess').Point;
        this.ChessPoints[pt.x][pt.y] = CommonDefine.PointTypeEnum.Empty;
        this.ChessNodes.delete(chessNode);
        chessNode.destroy();
        let endStatus = this.JudgeWin();
        if(endStatus != WinOrLoseEnum.NotEndYet)
        {
            return;
        }
        this.ThreeTypeCount--;
        if(this.ThreeTypeCount > 0)
        {
            let msg = this.ColorStr+"还可以吃对方"+this.ThreeTypeCount+"个子";
            this.ShowMessage(msg);
        }else{
            if(this.HighLightThreePoints.length>0)
            {
                this.HighLightChesses(false);
                this.HighLightThreePoints = [];
            }
            this.IsBlackTurn = !this.IsBlackTurn;
            this.ShowMessage(this.TurnNoticeStr);
            this.GameState = CommonDefine.GameStateEnum.MoveChess;
        }

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
        this.Notice.string = msg;
        // let messageText = cc.instantiate(this.MessageTextPrefab);
        // messageText.parent = this.node;
        // messageText.getComponent('MessageText').setMsg(msg,3);
    },

    OnRuleBtnClick()
    {
        let rule = cc.instantiate(this.RulePrefab);
        rule.parent = this.node;
    }

});
