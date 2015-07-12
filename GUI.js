/*
 * module for high-level ANSI/telnet GUIs
 * this library operates in terms of nodes,
 * where *everything* is a node:
 * static text, moving entities, and everything in between
 * it is similar to ncurses
 */

var NodeFactory = {
    "text": TextNode
};

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
        default: {
            console.error("Unknown node type found: "+descriptor.type);
            return;
        }
    }

    this.nodes.push(node);
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

module.exports = GUI;
