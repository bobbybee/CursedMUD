/*
 * User.js
 * prototype for a user object
 * which under the hood is just a connection
 */

var ansi = require("./ansi");

function User(connection) {
    this.connection = connection;
    
    // handle connection
    console.log("Incoming connection");

    // handle socket events
    this.connection.on("data", this.handleData);
    
    // initialize the users screen
    this.ansi().clear().bold().blink().text("Hello, World!").reset().flush();

    this.send(new Buffer([0xFF, 0xFB, 0x01, 0xFF, 0xFE, 0x01]));
}

// generic abstractions; mostly syntactic sugar anyway

User.prototype.send = function(buffer) {
    this.connection.write(buffer);
}

User.prototype.ansi = function() {
    return ansi(this);
}

// socket event handlers

User.prototype.handleData = function(data) {
    console.log(data); // for debug
}

module.exports.User = User;

// syntactic sugar
module.exports.constructor = function(c) {
    return new User(c);
}
