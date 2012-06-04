var Player = function(name, connection, id) {
  this.name = name,
  this.connection = connection,
  this.num_dice = 5,
  this.current_dice = [],
  this.id = id
}
function getId(p) { return p.id; }
function getIdAndDice(p) { return [p.id, p.num_dice]; }
function cyclePlayersSoPIsFirst(players, p) {
  // Class methods..?
  var pl = players.shift()
  while (pl !== p) {
    players.push(pl);
    pl = players.shift();
  }
  players.unshift(pl);
  return players;
}

var game = {
  players: [],
  round_plays: [],
  current_player: 0,
  inProgress: false,

  addPlayer: function(connection, data) {
    if (this.players.length > 4) {
      return false;
    }
    do {
      var player_id = Math.round(Math.random()*1000000000);
    } while (player_id in this.players.map(getId));
    var p = new Player(data.name, connection, player_id);
    this.players.push(p);
    // TODO: Move the check for 4 players here, instead of server.js.
    return [p.name, p.id, this.players.length];
  },

  // Initialize the game state, then the Server will take care of sending all
  // the beginning messages.
  startGame: function() {
    this.players.sort(function(i) {
      return i.id   // Sort by player ID; this is the turn order.
    });
    this.inProgress = true;
    this.rollTheDice();
    this.startRound(this.players[0]);
  },

  // Send the messages to start a round.
  startRound: function(firstPlayer) {
    this.players = cyclePlayersSoPIsFirst(this.players, firstPlayer);
    for (p in this.players) {
      var pl = this.players[p];
      this.sendMessage(pl, 'ROUNDSTART', {
        you: pl.id,
        players: this.players.map(getId),
        dice: pl.current_dice
      });
    }
    this.sendMessage(this.players[this.current_player], 'PLAYREQUEST', {
      plays: this.round_plays
    });
  },


  //// Utility functions, I guess.
  rollTheDice: function() {
    for (p in this.players) {
      var pl = this.players[p];
      pl.current_dice = [];
      for (var i=0; i<pl.num_dice; i++) {
        pl.current_dice.push(Math.floor(Math.random()*6)+1);
      }
    }
  },

  sendMessage: function(p, type, obj) {
    obj.type = type;
    p.connection.write(JSON.stringify(obj) + "\r\n");
  },

  destroyGame: function(str) {
    this.inProgress = false;
    for (p in this.players) {
      var pl = this.players[p];
      try {
        this.sendMessage(pl, "GAMEOVER", { string: str, winningplayer: null });
        //p.connection.destroy();
      } catch(e) { 
        // No big deal.
      }
    }
  },
  getCurrentPlayer: function() {
    return this.players[this.current_player];
  }
}
exports.game = game
