/*
 * User.js
 * prototype for a user object
 * which under the hood is just a connection
 */

function User(connection) {
    this.connection = connection;
    
    // handle connection
    console.log("Incoming connection");

    // handle socket events
    this.connection.on("data", this.handleData);
    
}

User.prototype.handleData = function(data) {
    console.log(data); // for debug
}

module.exports.User = User;

// syntactic sugar
module.exports.constructor = function(c) {
    return new User(c);
}
