/*
 * telnet.js
 * module for issuing telnet commands with a high level of abstraction
 * part of CursedMUD
 */

// either enables or disables echo

module.exports.echo = function(conn, state) {
    if(state == false) {
        // basically, we lie a bit... a white lie anyway
        // to surpress echo, we say:
        // we WILL echo; there you DONT echo
        // which is obviously just a WILL echo followed by a DONT echo
        // in reality, we may choose not to echo anyway
        // but that's a different problem :)
        
        conn.send(new Buffer([0xFF, 0xFB, 0x01, 0xFF, 0xFE, 0x01]));
    } else if(state == true) {
        // re-enabling echoing is the opposite process of above
        
        conn.send(new Buffer([0xFF, 0xFC, 0x01, 0xFF, 0xFD, 0x01]));
    }
}

module.exports.windowSize = function(conn) {
    conn.send(new Buffer([0xFF, 0xFD, 0x1F]));
}

// processes telnet input,
// and calls back with the data array,
// except with all telnet commands stripped
// TODO: parse for *all* telnet commands

module.exports.input = function(data, callback) {
    // scan for the 0xFF
    
    var output = [];
    var i = 0;

    while(i < data.length) {
        if(data[i] == 0xFF) {
            // what follows is a telnet command
            // TODO: actually parse this, instead of simply capturing it
            
            ++i;

            // DO/DONT/WILL/WONT command
            // simply consume the option
            // honey badger don't care
            
            if(data[i] >= 0xFB && data[i] <= 0xFE) ++i;
            else if(data[i] == 0xFA) {
                // subnegotation
                ++i;

                // if we're interested in the parameter, we'll parse it
                
                if(data[i] == 0x1F) {
                    // window size! we definitely care about this <3
                    
                    var width = (data[++i] << 8) | (data[++i]);
                    var height = (data[++i] << 8) | (data[++i]);

                    console.log(width+"x"+height);
                }

                // at this point, we simply consume until we're done
                
                while(data[i] != null && data[i] != 0xFF) ++i;
                ++i; // TODO: make sure this is actually 0xF0
            }
        } else {
            output.push(data[i]);
        }

        ++i;
    }

    return output;
}
