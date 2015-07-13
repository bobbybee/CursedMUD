var ansi = require("./ansi");

// text title of document

module.exports.title = function(content) {
    return {
        type: "text",
        content: content,
        bold: true,
        position: [ansi.center, ansi.top]
    };
}

// component that will wait for a single keypress upon which it returns

module.exports.anyKey = function(exit) {
    return {
        type: "empty",
        handleKey: function(key) {
            module.exports.sceneManager.switch(this.gui, exit);
        },
        focused: true
    };
}

// simple label, short-hand

module.exports.label = function(text, position, focusAction, connected) {
    return {
        type: "text",
        content: text,
        position: position,
        focusAction: focusAction,
        connected: connected
    };
}
