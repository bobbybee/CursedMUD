/*
 * CursedMUD
 * a modern multi-user dungeon, pushing the limits of console gaming
 * players, be warned for dragons lurking in the caves!
 * developers, be warned for dragons lurking in the code! :p
 * written by Alyssa Rosenzweig
 * July 2015
 */

var net = require("net");
var User = require("./User");

// each connection represents a user
// JavaScript voodoo abstracts this for us

net.createServer(User);
