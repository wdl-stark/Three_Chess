"use strict";
cc._RF.push(module, 'd5dde6X5KVPvappiaQV9Yjq', 'ArrayExtation');
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