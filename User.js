/*
 * User.js
 * prototype for a user object
 * which under the hood is just a connection
 */

function User(connection) {
    this.connection = connection;
}

module.exports = User;
