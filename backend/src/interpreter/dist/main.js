"use strict";
exports.__esModule = true;
var readline_sync_1 = require("readline-sync");
var interpreter_1 = require("./interpreter");
while (true) {
    var input = readline_sync_1["default"].question(">  ");
    console.log(interpreter_1.interpretSource(input));
}
