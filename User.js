/*
 * User.js
 * prototype for a user object
 * which under the hood is just a connection
 */

var ansi = require("./ansi");
var telnet = require("./telnet");
var GUI = require("./GUI");
var keys = require("./keys");
var SceneManager = require("./SceneManager");

function User(connection, sceneManager) {
    this.connection = connection;
    this.sceneManager = sceneManager;

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
    this.sceneManager.render(this.gui, "Main Menu");
}

// this renders *the entire scene from scratch*
// meaning, it's slooow and potentially high bandwidth
// it should only be done when it has to be:
// that is, when a new scene loads or the window is resized at the moment

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

    // now scan for special commands
    
    if(d.length == 3) {
        // arrows, maybe?
        if(d[0] == 27 && d[1] == 91) {
            if(d[2] == 66) {
                this.handleKey(keys.ARROW_DOWN);
                return;
            } else if(d[2] == 65) {
                this.handleKey(keys.ARROW_UP);
                return;
            } else if(d[2] == 68) {
                this.handleKey(keys.ARROW_LEFT);
                return;
            } else if(d[2] == 67) {
                this.handleKey(keys.ARROW_RIGHT);
                return;
            }
        }
    } else if(d.length == 2) {
        if(d[0] == 0x0D && d[1] == 0x00) {
            this.handleKey(keys.ENTER);
            return;
        }
    } else if(d.length == 1) {
        if(d[0] == 0x03) {
            this.quit();
        }
    }

    // anything else is handled as is
    
    var that = this;
    d.forEach(function(k) { that.handleKey(k) });
}

User.prototype.handleKey = function(key) {
    if(this.focusedElement && this.focusedElement.handleKey)
        this.focusedElement.handleKey(key, this.ansi(), this);
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
    
    if(!this.gameStarted) this.beginGame();
    else                  this.render();
}

User.prototype.pause = function(newScene) {
   this.oldScene = this.gui.currentScene;
   this.sceneManager.switch(this.gui, newScene);
}

User.prototype.unpause = function() {
    this.sceneManager.switch(this.gui, this.oldScene);
}

User.prototype.quit = function() {
    this.pause("Quit");
}

User.prototype.close = function() {
    this.gui.clear();
    this.connection.end();
}

module.exports.User = User;

// syntactic sugar
module.exports.constructor = function(c) {
    return new User(c, module.exports.sceneManager);
}
