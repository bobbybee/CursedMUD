/*
 * SceneManager.js
 * module for automating the process of creating scenes
 * Scenes are collections of nodes that stand by themselves
 * For instance, the main menu is a scene, as well the about page
 */

function SceneManager() {
    this.scenes = {};
    this.sceneID = "";
}

SceneManager.prototype.addScene = function(name, description) {
    this.scenes[name] = description;
}

SceneManager.prototype.render = function(gui, id) {
    if(id) this.sceneID = id;

    var scene = this.scenes[this.sceneID];

    var that = this;
    scene.forEach(function(node) {
        gui.addNode(node);
    });

    gui.render();
}

SceneManager.prototype.switch = function(gui, id) {
    this.sceneID = id;

    gui.clear();
    this.render(gui);
}

module.exports = SceneManager;
