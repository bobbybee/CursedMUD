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

ANSIEmitter.prototype.position = function(x, y) {
    var finalX = 0;
    var finalY = 0;

    if(x == module.exports.center) {
        finalX = 0.5 * this.connection.width; // TODO: proper centering + alignment
        finalY = y * this.connection.height;
    } else {
        finalX = x * this.connection.width;
        finalY = y * this.connection.height;
    }
    
    this.queue([27, 91]
            .concat(numberToArr(Math.floor(finalY)))
            .concat([59])
            .concat(numberToArr(Math.floor(finalX)))
            .concat([72]));

    return this;
}

// setup beautiful chaining interface

module.exports = function(conn) {
    return new ANSIEmitter(conn);
}

module.exports.center = -2;
