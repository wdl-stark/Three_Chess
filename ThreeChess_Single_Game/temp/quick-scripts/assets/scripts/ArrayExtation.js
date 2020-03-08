(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/scripts/ArrayExtation.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, 'd5dde6X5KVPvappiaQV9Yjq', 'ArrayExtation', __filename);
// scripts/ArrayExtation.js

"use strict";

(function () {
    Array.prototype.contains = function (elem) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == elem) {
                return true;
            }
        }
        return false;
    };

    Array.prototype.delete = function (o) {
        var index = this.indexOf(o);
        if (index != -1) {
            this.splice(index, 1);
        }
        return this;
    };
})();

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
        //# sourceMappingURL=ArrayExtation.js.map
        