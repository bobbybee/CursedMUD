var ansi = require("./ansi");
var Components = require("./Components");

module.exports = function(sceneManager) {
    Components.sceneManager = sceneManager;

    sceneManager.addScene("Main Menu", [
            Components.title("Welcome to CursedMUD"),
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
                    sceneManager.switch(this.gui, option);
                },
                focused: true
            }
    ]);

    sceneManager.addScene("Login", [
        Components.title("Login"),
        Components.anyKey("Main Menu")
    ]);

    sceneManager.addScene("Register", [
        Components.title("Register"),
        Components.anyKey("Main Menu")
    ]);

    sceneManager.addScene("About", [
            Components.title("About"),
            Components.anyKey("Main Menu")
    ]);

    sceneManager.addScene("Quit", [
            Components.title("Are you sure you want to quit?"),
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
