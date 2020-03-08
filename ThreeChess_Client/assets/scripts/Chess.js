const PointTypeEnum = {
    Invalid:0,
    Empty:1,
    BlackChess:2,
    WhiteChess:3,
    DoubleChess:4,
};

cc.Class({
    extends: cc.Component,

    properties: {
        ChessImage:cc.Sprite,
        ChessSprite:[cc.SpriteFrame],
        //HighLightSprite:[cc.SpriteFrame],
        NewChessSprite:[cc.SpriteFrame],
        //SmallWhiteDot:cc.Node,
        _point:null,
        Point:{
            get(){
                return this._point;
            },
            set(value){
                this._point = value;
            }
        },
        IsBlack:true,
        SrcPos:null,
        IsCurrentFlag:{
            set(value){
                let index = this.IsBlack ? 0 : 1;
                if(value)
                {
                    this.ChessImage.spriteFrame = this.NewChessSprite[index];
                }
                else{
                    this.ChessImage.spriteFrame = this.ChessSprite[index];
                }
            }
        }
    },

    

    start () {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchChess, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onMoveEnd, this);
    },

    InitChess(isBlack,isNew)
    {
        this.IsBlack = isBlack;
        this.ChessImage.spriteFrame = isBlack ? this.ChessSprite[0] : this.ChessSprite[1];
        this.IsCurrentFlag = isNew;
    },
    
    Flash()
    {
        this.node.getComponent(cc.Animation).play();
    },
    StopFlash()
    {
        this.node.getComponent(cc.Animation).stop();
        this.node.opacity = 255;
    },
    onTouchChess(event)
    {
        if(window.GameController.GameState == CommonDefine.GameStateEnum.MoveChess &&
            this.IsBlack == window.GameController.IsBlackTurn)
        {
            window.GameController.SelectChess(this.Point);
        }else if(window.GameController.GameState == CommonDefine.GameStateEnum.EatChess &&
            this.IsBlack == !window.GameController.IsBlackTurn)
        {
            window.GameController.EatChess(this.node);
        }
    },
    
    onMoveEnd(event)
    {
        return;
        if(window.GameController.GameState != CommonDefine.GameStateEnum.MoveChess ||
            this.IsBlack != window.GameController.IsBlackTurn)
        {
            return;
        }
        let parent = window.GameController.Board;
        let pos = this.node.position;
        let worldPos = this.node.parent.convertToWorldSpaceAR(pos);
        let localPos = parent.convertToNodeSpaceAR(worldPos);
        let to_point = window.GameController.CheckPosInPoint(localPos,CommonDefine.PointTypeEnum.Empty);
        if(to_point != null)//坐标点落在某个棋盘点上且该棋盘点上无子
        {
            return;
            let bCanMove = window.GameController.CheckCanMoveTo(this.Point,point);
            if(bCanMove)//该棋盘点是当前棋子的合法行走点
            {
                let centerPos = window.GameController.Point2Position(point);
                this.node.parent = parent;
                this.node.position = centerPos;
                let prePt = cc.v2(this.Point.x,this.Point.y);
                this.Point = point;
                window.GameController.NewChess.IsCurrentFlag = false;
                this.IsCurrentFlag = true;
                window.GameController.NewChess = this;
                window.GameController.AfterMoveTo(prePt,point);
            }
        }

    }
});
