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

/* node definitions */

function TextNode(content, position, bold, blinking) {
    this.content = content;
    this.position = position;
    this.bold = bold;
    this.blinking = blinking;
    this.type = "text";
}

TextNode.prototype.render = function(ansi, connection) {
    if(this.bold) ansi.bold();
    if(this.blinking) ansi.blink();

    ansi.positionText(this.position[0], this.position[1], this.content);
    ansi.reset();
}

module.exports = GUI;
