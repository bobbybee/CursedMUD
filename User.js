/*
 * User.js
 * prototype for a user object
 * which under the hood is just a connection
 */

var ansi = require("./ansi");
var telnet = require("./telnet");
var GUI = require("./GUI");
var keys = require("./keys");

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
        .text("Fetching window size..\n")
        .reset()
        .text("If this message persists and/or you see garbage characters,\n")
        .text("You need to use a telnet-compatible client as opposed to raw TCP.\n")
        .flush();

    telnet.echo(this, false); // supress echo
    telnet.windowSize(this);
    telnet.characterMode(this);

    this.paused = true;
    this.focusedElement = null;
}

User.prototype.beginGame = function() {
    this.gameStarted = true;
    this.paused = false;

    this.gui = new GUI(this);
    
    this.gui.addNode({
        type: "text",
        content: "Welcome to CursedMUD",
        bold: true,
        position: [ansi.center, ansi.top]
    });

    this.gui.addNode({
        type: "text",
        content: "Main Menu",
        position: [ansi.right, ansi.bottom]
    });

    this.focusedElement = this.gui.addNode({
        type: "menu",
        options: ["Login", "Register", "About"],
        position: [ansi.center, 0.2],
        interval: 0.2
    });

    this.render();
}

// TODO: possible performance bottleneck?
// notably, we shouldn't be flushing more than once

User.prototype.render = function() {
    this.gui.render();
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

    var d = telnet.input(this, data);

    if(d.length == 3) {
        // arrows, maybe?
        if(d[0] == 27 && d[1] == 91) {
            if(d[2] == 66) {
                this.handleKey(keys.ARROW_DOWN);
            } else if(d[2] == 65) {
                this.handleKey(keys.ARROW_UP);
            } else if(d[2] == 68) {
                this.handleKey(keys.ARROW_LEFT);
            } else if(d[2] == 67) {
                this.handleKey(keys.ARROW_RIGHT);
            }
        }
    }
}

User.prototype.handleKey = function(key) {
    if(this.focusedElement) {
        if(this.focusedElement.handleKey) {
            this.focusedElement.handleKey(key);
        }
    }
}

User.prototype.windowSizeChange = function(width, height) {
    this.width = width;
    this.height = height;
    
    if(this.width < 40 || this.height < 20) {
        this.ansi()
            .clear()
            .position(ansi.top, ansi.left)
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
    else                  this.render();
}

module.exports.User = User;

// syntactic sugar
module.exports.constructor = function(c) {
    return new User(c);
}
