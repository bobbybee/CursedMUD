/*
 * ansi.js
 * module to emit ANSI escape codes over the network
 */

function ANSIEmitter(conn) {
    this.connection = conn;
    this.codes = [];
}

ANSIEmitter.prototype.queue = function(data) {
    this.codes.push(new Buffer(data));
}

ANSIEmitter.prototype.flush = function() {
    this.connection.send(Buffer.concat(this.codes));
}

ANSIEmitter.prototype.clear = function() {
    this.queue([27, 91, 50, 74]);
    return this;
}

module.exports = function(conn) {
    return new ANSIEmitter(conn);
}
