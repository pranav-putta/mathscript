"use strict";
exports.__esModule = true;
exports.Queue = exports.mod = exports.isdigit = exports.isalnum = exports.isspace = void 0;
var errors_1 = require("./errors");
/**
 * checks if given text contains only whitespace
 * @param text input character
 */
function isspace(text) {
    return text == " " || text == "\t";
}
exports.isspace = isspace;
/**
 * checks if given text is an alphanumeric
 * @param text input character
 */
function isalnum(text) {
    return text.match(/^[a-z0-9]+$/i) !== null;
}
exports.isalnum = isalnum;
/**
 * checks if given text contains a digit
 * @param text input character
 */
function isdigit(text) {
    return !isNaN(parseInt(text));
}
exports.isdigit = isdigit;
/**
 * returns the positive modulo of the two numbers
 * @param a first integer
 * @param b second integer
 */
function mod(a, b) {
    if (Number.isInteger(b)) {
        var out = a % b;
        return out >= 0 ? out : out + b;
    }
    throw new errors_1.ArithmeticError("expected an integer for mod");
}
exports.mod = mod;
/**
 * circular array based queue implementation
 */
var Queue = /** @class */ (function () {
    function Queue() {
        this.INITIAL_CAPACITY = 9;
        this.data = new Array(this.INITIAL_CAPACITY);
        this._size = 0;
        this.front = 0;
    }
    Object.defineProperty(Queue.prototype, "size", {
        get: function () {
            return this._size;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * inserts all data in array to the back of the queue
     * @param data data array to insert
     */
    Queue.prototype.pushAll = function (data) {
        var _this = this;
        data.forEach(function (val) {
            _this.push(val);
        });
    };
    /**
     * inserts data into back of queue
     * @param data data to insert
     */
    Queue.prototype.push = function (data) {
        if (this._size == this.data.length) {
            var temp = new Array(this.size * 2);
            temp[0] = data;
            for (var i = 0; i < this.size; i++) {
                temp[i + 1] = this.data[(this.front + i) % this.size];
            }
            this.data = temp;
            this.front = 0;
        }
        else {
            this.data[(this.front + this._size) % this.data.length] = data;
        }
        this._size++;
    };
    /**
     * returns next element in queue
     * @returns E if object found, undefined otherwise
     */
    Queue.prototype.peek = function () {
        if (this.size > 0) {
            return this.data[this.front];
        }
        return undefined;
    };
    /**
     * removes current element in queue and returns
     * @returns E if object found, undefined otherwise
     */
    Queue.prototype.pop = function () {
        if (this.size > 0) {
            var out = this.data[this.front];
            this.front = (this.front + 1) % this.data.length;
            this._size--;
            return out;
        }
        return undefined;
    };
    return Queue;
}());
exports.Queue = Queue;
