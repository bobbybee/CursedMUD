/*
 * User.js
 * prototype for a user object
 * which under the hood is just a connection
 */

var ansi = require("./ansi");
var telnet = require("./telnet");

function User(connection) {
    this.connection = connection;
    
    // handle connection
    console.log("Incoming connection");

    // handle socket events
    var that = this;
    
    this.connection.on("data", function(data) {
        that.handleData(data);
    });
    
    // initialize the users screen
    this.ansi()
        .clear()
        .bold()
        .text("Fetching window size..")
        .reset()
        .flush();

    telnet.echo(this, false); // supress echo
    telnet.windowSize(this);

    this.paused = true;
}

User.prototype.beginGame = function() {
    this.gameStarted = true;
    this.paused = false;

    this.ansi()
        .clear()
        .bold()
        .positionText(ansi.center, 0, "Welcome to CursedMUD")
        .reset()
        .flush();
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
    // the incoming data roughly falls into one of three categories:
    // 1) telnet commands, like window size updates
    // 2) TTY commands, like arrow keys
    // 3) plain text, pretty much everything else
    
    // telnet commands have to be thoroughly parsed for detection, however,
    // so we run the buffer through the telnet interface first

    console.log(telnet.input(this, data));
}

User.prototype.windowSizeChange = function(width, height) {
    this.width = width;
    this.height = height;
    
    if(this.width < 40 || this.height < 20) {
        this.ansi()
            .clear()
            .position(0, 0)
            .text("Your screen's too small! Please resize your window")
            .flush();
 
        this.paused = true;       
        return;
    }
        
    // this event is needed to start the GUI
    // so if this is the first one, we (try) to begin the game
    // TODO: support the other events that need to happen,
    // like ensuring that the terminal is in raw mode
    
    if(!this.gameStarted) this.beginGame();
}

module.exports.User = User;

// syntactic sugar
module.exports.constructor = function(c) {
    return new User(c);
}
