var ansi = require("./ansi");

module.exports = function(sceneManager) {
    sceneManager.addScene("Main Menu", [
            {
                type: "text",
                content: "Welcome to CursedMUD",
                bold: true,
                position: [ansi.center, ansi.top]
            },
            {
                type: "text",
                content: "Main Menu",
                position: [ansi.right, ansi.bottom]
            },
            {
                type: "menu",
                options: ["Login", "Register", "About"],
                position: [ansi.center, 0.2],
                interval: 0.2,
                callback: function(option) {
                    sceneManager.switch(this.gui, "About");
                },
                focused: true
            }
    ]);

    sceneManager.addScene("About", [
            {
                type: "text",
                content: "About",
                bold: true,
                position: [ansi.center, ansi.top]
            },
            {
                type: "empty",
                handleKey: function(key) {
                    sceneManager.switch(this.gui, "Main Menu");
                },
                focused: true
            }
    ]);

    sceneManager.addScene("Quit", [
            {
                type: "text",
                content: "Are you sure you want to quit?",
                bold: true,
                position: [ansi.center, ansi.top]
            },
            {
                type: "menu",
                options: ["Yes", "No"],
                position: [ansi.center, 0.2],
                interval: 0.2,
                callback: function(option) {
                    if(option == "Yes") {
                        this.connection.close();
                    } else {
                        this.connection.unpause();
                    }
                },
                focused: true
            }
    ]);
}; 
