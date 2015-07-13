/*
 * ansi.js
 * module to emit ANSI escape codes over the network
 */

function ANSIEmitter(conn) {
    this.connection = conn;
    this.codes = [];
}

// setup high level queueing operations

ANSIEmitter.prototype.queue = function(data) {
    this.codes.push(new Buffer(data));
}

ANSIEmitter.prototype.flush = function() {
    this.connection.send(Buffer.concat(this.codes));
}

// simply writes text as-is to the buffer
ANSIEmitter.prototype.text = function(text) {
    this.queue(text);
    return this;
}

// clears the screen
ANSIEmitter.prototype.clear = function() {
    this.queue([27, 91, 50, 74]);
    return this;
}

/* fancy text */

// first and foremost, resets all fanciness
ANSIEmitter.prototype.reset = function() {
    this.queue([27, 91, 48, 109]);
    return this;
}

// styles

ANSIEmitter.prototype.bold = function() {
    this.queue([27, 91, 49, 109]);
    return this;
}

ANSIEmitter.prototype.blink = function() {
    this.queue([27, 91, 53, 109]);
    return this;
}

// position

function numberToArr(n) {
    return n.toString().split("").map(function(a) {
        return a.charCodeAt(0);
    });
}

ANSIEmitter.prototype.finalPositioning = function(x, y, length) {
    var finalX = 0;
    var finalY = 0;

    length = length || 0;
    
    if(x == module.exports.center) {
        finalX = 0.5 * (this.connection.width - length);
    } else if(x == module.exports.right) {
        finalX = this.connection.width - length;
    } else {
        finalX = x * this.connection.width;
    }
    
    if(y == module.exports.bottom) {
        finalY = this.connection.height;
    } else if(y == module.exports.center) {
        finalY = 0.5 * this.connection.height;
    } else {
        finalY = y * this.connection.height;
    }
 
    return [Math.floor(finalX), Math.floor(finalY)];
}

ANSIEmitter.prototype.position = function(x, y, length) {
    var position = this.finalPositioning(x, y, length);
    
    this.queue([27, 91]
            .concat(numberToArr(position[1]))
            .concat([59])
            .concat(numberToArr(position[0]))
            .concat([72]));

    return this;
}

ANSIEmitter.prototype.stringBounds = function(x, y, length) {
    var position = this.finalPositioning(x, y, length);

    return [position[1], [position[0], position[0] + length]];
}

ANSIEmitter.prototype.positionText = function(x, y, text) {
    this.position(x, y, text.length)
        .text(text);

    return this;
}

ANSIEmitter.prototype.cursor = function(enabled) {
    if(enabled) {
        this.queue([27, 91, 63, 50, 53, 104]);
    } else {
        this.queue([27, 91, 63, 50, 53, 108]);
    }

    return this;
}

// setup beautiful chaining interface

module.exports = function(conn) {
    return new ANSIEmitter(conn);
}

module.exports.left = 0;
module.exports.center = -2;
module.exports.right = -3;
module.exports.bottom = -1;
module.exports.top = 0;

module.exports.none = 0;
module.exports.underline = -1;
