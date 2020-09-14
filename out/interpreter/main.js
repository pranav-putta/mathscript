"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var readline_sync_1 = __importDefault(require("readline-sync"));
var interpreter_1 = require("./interpreter");
while (true) {
    var input = readline_sync_1.default.question(">  ");
    console.log(interpreter_1.interpretSource(input));
}
//# sourceMappingURL=main.js.map