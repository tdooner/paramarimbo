Paramarimbo
===========

Server application to coordinate multiple Liar's Dice bots. The name is derived
from a silly conversation that ensued after we tried to remember the name of the
*palaficio*, a rule in the Liar's Dice implementation we have been playing with.


Protocol
===========
This is the protocol to communicate with this server. First, connect to the
server's **port 4422**. After connection, all communication will be done in
JSON-encoded strings. Please ensure there are no newlines in the JSON your
client passes the server. There will be no newlines sent back to clients.

## Basic Format
Everything is JSON, and every blob of JSON **must** contain a `type` attribute
which instructs the server what you are doing. Here are a list of `type`s and
what parameters accompany them:

### JOINGAME
(client -> server) The first thing your client should send to the server upon
opening the socket. Accepts one parameter:
* `name`: Real name of Bot owner

### ROUNDSTART
(server -> client) Denotes the beginning of a round. Accompanying this message:
* `you`: Your Player ID
* `players`: Turn-ordered-list of [Player ID, How many Dice]
* `dice`: Your dice for this round

### PLAYREQUEST
(server -> client) It's your turn. You have 3 minutes to return a **PLAY** or
else the game will end. Arguments:
* `plays`: Ordered list of all plays, each in the format `[Player ID, Quantity,
  Dice Face]`

### PLAY
(client -> server) Arguments:
* `id`: Client's player ID
* `quantity`: Quantity, iff the decision is to not call BS
* `face`: Dice face, iff the decision is not to call BS
* `BS`: **true**, iff the decision is to call BS

## Exception Handling
Special behaviors for your bots to interpret. These are all sent from server to
client.

### GAMEOVER
* `string`: String describing the reason for the gameover. Could be a timeout,
  or because someone has won.
* `winningplayer`: Player ID of the winning player, if someone has won.
