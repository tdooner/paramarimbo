var net = require('net');
var game = require('./game.js').game;
var HOST = '127.0.0.1';
var PORT = 4422;

var giveError = function(c, msg, destroy) {
  c.write(JSON.stringify({type: 'ERROR', message: msg}) + "\r\n");
  if (destroy) {
    c.end();
  }
}
var server = net.createServer(function(c) {
  console.log(c.remoteAddress + ' - Connection Succeeded! Awaiting bootstrap...');
  c.on('end', function() {
    console.log(c.remoteAddress + ' - Connection ended.');
    if (game.inProgress) {
      game.destroyGame();
    }
  });
  c.on('data', function(d) {
    try {
      t = JSON.parse(d);
    } catch(e) {
      giveError(c, "Could not parse JSON.")
      return;
    }
    if (!t.type) {
      giveError(c, "No type.");
      return;
    } else {
      console.log(c.remoteAddress + " - " + t.type);
    }
    switch (t.type) {
      case "JOINGAME":
        i = game.addPlayer(c,t);
        if (!i) {
          giveError(c, "There are already 4 players! Bye!", true);
          return;
        }
        console.log("Gave " + i[0] + " Player ID " + i[1]);
        // If all the players are in, start the game!
        if (i[2] === 4) {
          game.startGame();
        }
        break;
      case "PLAY":
        if (game.getCurrentPlayer().connection != c) {
          giveError(c, "You are not the correct player!");
          return;
        }
         if (!game.isValidMove(t)) {
          giveError(c, "Invalid Play!");
          return;
        } else {
          game.submitMove(t);
        }
        break;
      default:
        giveError(c, "Invalid type.");
        break;
    }
    //console.log(c.remoteAddress + ' - Received data ' + t.type);
  });
}).listen(PORT, HOST, function() { //'listening' listener
    console.log('Server bound to '+HOST+':'+PORT);
});
