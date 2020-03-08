
cc.Class({
    extends: cc.Component,

    properties: {
        RuleText: cc.RichText,
    },
    Show()
    {
        
    },

    OnCloseButtonClick()
    {
        this.node.destroy();
    }
   
});
