/*
 * module for high-level ANSI/telnet GUIs
 * this library operates in terms of nodes,
 * where *everything* is a node:
 * static text, moving entities, and everything in between
 * it is similar to ncurses
 */

var keys = require("./keys");

function GUI(conn) {
    this.conn = conn;
    this.nodes = [];
}

GUI.prototype.addNode = function(descriptor) {
    var node = false;
    
    switch(descriptor.type) {
        case "text": {
            node = new TextNode(
                    descriptor.content || "",
                    descriptor.position || [0,0], 
                    descriptor.bold || false, 
                    descriptor.blinking || false);
            break;
        }
        case "menu": {
            node = new MenuNode(
                    this.conn,
                    descriptor.options || [],
                    descriptor.defaultOption || 0,
                    descriptor.position || [0,0],
                    descriptor.interval || 0.1,
                    descriptor.callback || null);
            break;
        }
        case "empty": {
            node = new EmptyNode(this.conn);

            if(descriptor.handleKey) node.handleKey = descriptor.handleKey;
            if(descriptor.move) node.move= descriptor.move;
            if(descriptor.change) node.change = descriptor.change;
            if(descriptor.render) node.render = descriptor.render;

            break;
        }
        case "input": {
            node = new InputNode(
                    descriptor.defaultValue || "",
                    descriptor.position || [0,0],
                    descriptor.length || 8);

            break;
        }
        default: {
            console.error("Unknown node type found: "+descriptor.type);
            return;
        }
    }

    this.nodes.push(node);

    if(descriptor.focused)
        this.conn.focusedElement = node;

    return node;
}

GUI.prototype.render = function() {
    var ansi = this.conn.ansi().clear();
    
    this.nodes.forEach(function(node) {
        node.render(ansi, this.conn);
    });

    ansi.flush();
}

GUI.prototype.change = function(node, content) {
    node.change(content, this.conn.ansi(), this.conn);
}

GUI.prototype.move = function(node, x, y) {
    node.move(x, y, this.conn.ansi(), this.conn);
}

GUI.prototype.clear = function() {
    this.nodes = [];
    this.conn.ansi().clear().flush();
    this.conn.focusedElement = null;
}

/* node definitions */

function TextNode(content, position, bold, blinking) {
    this.content = content;
    this.position = position;
    this.bold = bold;
    this.blinking = blinking;
    this.type = "text";
}

TextNode.prototype.setAttributes = function(ansi, connection) {
    if(this.bold) ansi.bold();
    if(this.blinking) ansi.blink();
}

/*
 * render the TextNode *from scratch*
 * this routine is for when the screen is cleared,
 * but NOT when the text is changed,
 * as an optimization.
 */

TextNode.prototype.render = function(ansi, connection) {
    this.setAttributes(ansi, connection);

    this.bounds = ansi.stringBounds(this.position[0], this.position[1], this.content.length);

    ansi.positionText(this.position[0], this.position[1], this.content);
    ansi.reset();
}

/*
 * clears the TextNode in place
 * that is, replaces it with spaces, but doesn't influence the rest of the scene
 */

TextNode.prototype.clear = function(ansi, connection) {
    ansi.positionText(this.position[0], this.position[1], Array(this.content.length+1).join(" "));
}

/*
 * works like clear,
 * except instead of filling with spaces,
 * it fills with this.content
 */

TextNode.prototype.rewrite = function(ansi, connection) {
    var newContent = this.content + Array( (this.bounds[1][1] - this.bounds[1][0]) - (this.content.length) + 1).join(" ");
    
    ansi.positionText(this.position[0], this.position[1], newContent);

    // update bounds
    this.bounds = ansi.stringBounds(this.position[0], this.position[1], this.content.length);
}

/*
 * changes the text content in place
 * faster than using render, but identical in principle
 */

TextNode.prototype.change = function(content, ansi, connection) {
    this.setAttributes(ansi, connection);
    this.content = content.toString();
    this.rewrite(ansi, connection);
    ansi.flush();
}

/*
 * moves the node to somewhere else
 */

TextNode.prototype.move = function(x, y, ansi, connection) {
    this.clear(ansi, connection); // prevent artifacts
    this.position = [x, y]; // future writes go to the new location
    this.render(ansi, connection); // a full rendering is needed :(
    ansi.flush();
}

/*
 * MenuNode
 * implements a menu that lets the user select one option
 * it's internally implemented with textnodes
 */

function MenuNode(connection, options, defaultOption, position, interval, callback) {
    this.gui = connection.gui;
    this.connection = connection;
    
    // spawn TextNode's for each option
    
    this.nodes = [];
    var that = this;

    options.forEach(function(text, i) {
        that.nodes.push(that.gui.addNode({
            type: "text",
            content: ((defaultOption == i) ? "* " : "  ") + text,
            position: [position[0], position[1] + (interval * i)]
        }));
    });

    this.options = options;
    this.selectedOption = defaultOption;

    this.callback = callback;
}

MenuNode.prototype.change = function(options, ansi, connection) {
    /* stub */
}

MenuNode.prototype.move = function(x, y, ansi, connection) {
    /* stub */
}

MenuNode.prototype.render = function() {
    /* stub */
}

MenuNode.prototype.handleKey = function(key) {
    if(key == keys.ARROW_DOWN) {
        this.changeOption(1);
    } else if(key == keys.ARROW_UP) {
        this.changeOption(-1);
    } else if(key == keys.ENTER) {
        this.selectOption();
    }
}

MenuNode.prototype.changeOption = function(amount) {
    if(this.selectedOption + amount >= this.options.length || this.selectedOption + amount < 0) return;

    this.gui.change(this.nodes[this.selectedOption], "  " + this.options[this.selectedOption]);
    this.selectedOption += amount;
    this.gui.change(this.nodes[this.selectedOption], "* " + this.options[this.selectedOption]);
}

MenuNode.prototype.selectOption = function() {
    if(this.callback)
        this.callback(this.options[this.selectedOption]);
}

function EmptyNode(connection) {
    this.connection = connection;
    this.gui = this.connection.gui;
}

EmptyNode.prototype.change = function() { /* stub */ };
EmptyNode.prototype.move = function() { /* stub */ };
EmptyNode.prototype.render = function() { /* stub */ };
EmptyNode.prototype.handleKey = function() { /* stub */ };

// InputNode is somewhere the user can type
// like the <input> tag in HTML,
// implemented like elinks

function InputNode(defaultText, position, length) {
    this.contents = defaultText;
    this.length = length;

    this.text = new TextNode(this.getVisible(), position, false, false);
}

InputNode.prototype.render = function(ansi, connection) {
    this.text.render(ansi, connection);
}

InputNode.prototype.move = function() { /* stub */ };
InputNode.prototype.change = function() { /* stub */ };

// returns the visual portion of the text

InputNode.prototype.getVisible = function() {
    if(this.length < this.contents.length) {
        // too much text!
        // only display the end
        
        return this.contents.slice(-this.length);
    } else if(this.length >= this.contents.length) {
        // too little text!
        // pad with underscores
        
        return this.contents + Array(this.length - this.contents.length + 1).join("_");
    }
}

InputNode.prototype.handleKey = function(key, ansi, connection) {
    // TODO: handle backspace, enter, etc.
    
    this.contents += String.fromCharCode(key);
    this.text.change(this.getVisible(), ansi, connection);
}

module.exports = GUI;
