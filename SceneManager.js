/*
 * SceneManager.js
 * module for automating the process of creating scenes
 * Scenes are collections of nodes that stand by themselves
 * For instance, the main menu is a scene, as well the about page
 */

function SceneManager(connection, gui) {
    this.connection = connection;
    this.gui = gui;

    this.scenes = {};
    this.sceneID = "";
}

SceneManager.prototype.addScene = function(name, description) {
    this.scenes[name] = description;
}

SceneManager.prototype.render = function(id) {
    if(id) this.sceneID = id;

    var scene = this.scenes[this.sceneID];

    var that = this;
    scene.forEach(function(node) {
        that.gui.addNode(node);
    });

    this.gui.render();
}

SceneManager.prototype.switch = function(id) {
    this.sceneID = id;

    this.gui.clear();
    this.render();
}

module.exports = SceneManager;
