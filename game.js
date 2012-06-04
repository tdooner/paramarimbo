var Player = function(name, connection, id) {
  this.name = name,
  this.connection = connection,
  this.num_dice = 5,
  this.current_dice = [],
  this.hasLost = false,
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
    this.startRound(this.players[0]);
  },

  // Send the messages to start a round.
  startRound: function(firstPlayer) {
    this.rollTheDice();
    this.round_plays = [];
    this.current_player = 0;
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

  endRound: function() {
    // A round ends when someone submits a "BS" move.
    var last_bet = this.round_plays[this.round_plays.length-2];
    var BS_bet = this.round_plays[this.round_plays.length-1];
    var num_of_correct = 0;
    // Check if the last bet is valid!
    for (p in this.players) {
      var pl = this.players[p];
      for (d in pl.current_dice) {
        if (pl.current_dice[d] === last_bet.face) {
          // TODO: Add Palaficio logic here.
          num_of_correct++;
        }
      }
    }
    console.log("Found " + num_of_correct + " dice that are " + last_bet.face);
    // Remove the dice, and check for players.
    // TODO: Wildcard.
    // TODO: This is bad...
    if (num_of_correct >= last_bet.quantity) {
      // Remove a die from the BS-ing player.
      var pl = this.players[this.getPlayerIndex(BS_bet.id)];
      var other = this.players[this.getPlayerIndex(last_bet.id)];
    } else {
      var pl = this.players[this.getPlayerIndex(last_bet.id)];
      var other = this.players[this.getPlayerIndex(BS_bet.id)];
    }
    pl.num_dice -= 1;
    if (this.players.length === 1) {
      this.sendMessage(this.players[0], "GAMEOVER", {
        winningplayer: this.players[0].id
      });
    } else {
      if (pl.num_dice <= 0) {
        this.players = this.players.slice(this.getPlayerIndex(pl.id), 1);
        this.startRound(other);
      } else { 
        this.startRound(pl);
      }
    }
  },

  submitMove: function(m) {
    // This function assumes the move has been validated with isValidMove()
    this.round_plays.push({
      id: this.getCurrentPlayer().id, 
      quantity: m.quantity,
      face: m.face,
      BS: m.BS
    });
    // If the move is BS, then end the round. 
    if (m.BS) {
      console.log("this.endRound()");
      this.endRound();
      return;
    } else {
      // If the move isn't BS, then send the next player a message!
      this.current_player += 1;
      this.sendMessage(this.players[this.current_player], 'PLAYREQUEST', {
        plays: this.round_plays
      });
    }
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

  isValidMove: function(m) {
    //TODO: Step through this logic.
    if (this.round_plays.length == 0) {
      return !m.BS; // Cannot BS the first round.
    }
    // First validate the move independently...
    if (m.BS) {
      if (m.BS !== true) {
        return false;
      }
    }
    if (m.face > 6) {
      return false;
    }
    // Then validate the move in the series of the round...
    var last_move = this.round_plays[this.round_plays.length-1];
    if (last_move.quantity <= m.quantity && last_move.face <= m.face || 
      !(last_move.quantity == m.quantity && last_move.face == m.face)) {
      return true;
    } else {
      return false;
    }
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
  },
  getPlayerIndex: function(id) {
    // TODO: This kinda sucks.
    for (i in this.players) {
      if (this.players[i].id === id) {
        return i;
      }
    }
  }
}
exports.game = game
