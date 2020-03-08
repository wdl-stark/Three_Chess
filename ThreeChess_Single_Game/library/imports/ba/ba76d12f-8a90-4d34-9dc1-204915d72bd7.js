"use strict";
cc._RF.push(module, 'ba76dEvipBNNJ3BIEkV1yvX', 'Rule');
// scripts/Rule.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        RuleText: cc.RichText
    },
    Show: function Show() {},
    OnCloseButtonClick: function OnCloseButtonClick() {
        this.node.destroy();
    }
});

cc._RF.pop();