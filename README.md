# Tic-tac-toe on WAX

## Overview

This tic-tac-toe contract provides an example of building a game on WAX, complete with secure use of random values to determine game outcomes.

This will guide you how to make the Tictactoe game contract which run on Wax blockchain. Logic of the tictactoe game follow the eosio sample at [Tic-tac-toe Game EOS tutorial](https://developers.eos.io/welcome/v2.1/tutorials/tic-tac-toe-game-smart-contract-single-node), but we'll add more logic that support randomize the first turner and random game move if playing with bot. 

The UI for this project is available here: [https://github.com/worldwide-asset-exchange/tic-tac-toe-front-end](https://github.com/worldwide-asset-exchange/tic-tac-toe-front-end).


### How To Play

Here's a step-by-step guide on how to play:

1. **Setup**: Click `Play Game`

<img src="./images/splash.png"/>

And choose `New Game`

<img src="./images/new_game.png"/>

2. **Players**: Tic Tac Toe is typically played by two players. One player is assigned "X" and the other "O".

<img src="./images/new_game_popup.png"/>

3. **Objective**: The goal is to be the first to create a row of three of your marks (X's or O's) either horizontally, vertically, or diagonally.

4. **Gameplay**: Players take turns placing their mark (X or O) in an empty square on the grid.

5. **Turns**: The player assigned "X" usually goes first, followed by the player assigned "O". Players continue taking turns until one player wins or the grid is full (resulting in a tie).

<img src="./images/playing_game.png"/>

6. **Winning**: A player wins the game if they successfully create a row of three of their marks either horizontally, vertically, or diagonally. If a player achieves this, they declare "Tic Tac Toe!" and are declared the winner.

7. **Ties**: If all squares are filled without either player achieving three in a row, the game ends in a tie.

<img src="./images/winner.png"/>

8. **Rematch**: Players can easily start a new game and beginning again.



## Developing the contract

### 1. Prerequisites
  - https://github.com/AntelopeIO/cdt: Contract development toolkit for developing the contract
  - https://github.com/AntelopeIO/leap: Include the **cleos** command line tool to interact with the blockchain.
  - Node.js (Version: 16.16.0) or Yarn (Version: 1.22.17) & npm (Version: 9.6.7) installed on your machine.

### 2. Build and Test
```
    make build
    npm run test
```

### 3. Deployment


1. Create new account for contract tictactoe and tic.token

```
    cleos system newaccount eosio tictactoe EOS79McmuaymB8tPJmMVqUAjbbfLKBv5D13aVpgPXcZEdLYMQBL2b EOS79McmuaymB8tPJmMVqUAjbbfLKBv5D13aVpgPXcZEdLYMQBL2b --stake-net "10.00000000 WAX" --stake-cpu "10.00000000 WAX" --buy-ram-bytes 559700 -p eosio
    cleos system newaccount eosio tic.token EOS79McmuaymB8tPJmMVqUAjbbfLKBv5D13aVpgPXcZEdLYMQBL2b EOS79McmuaymB8tPJmMVqUAjbbfLKBv5D13aVpgPXcZEdLYMQBL2b --stake-net "10.00000000 WAX" --stake-cpu "10.00000000 WAX" --buy-ram-bytes 559700 -p eosio
```

2. Deploy the game and token

```
    cleos set contract tictactoe ./build tictactoe.wasm tictactoe.abi -p tictactoe@active
    cleos set contract tic.token ./build token.wasm token.abi -p tic.token@active
    cleos set account permission tictactoe active --add-code
    cleos set account permission tic.token active --add-code
```

3. Init game

```
    cleos push action tictactoe init '[]' -p tictactoe@active
```

4. Mint token for the game contract

```
cleos push action tic.token create '["tictactoe","1000000.0000 TIC"]' -p tic.token@active
cleos push action tic.token issue '["tictactoe","1000000.0000 TIC","issue token"]' -p tictactoe@active
```


# Tic-tac-toe Smart Contract Tutorial

### 1. Game Logic
  - Player can create the game in one of two modes: player vs player or player vs bot
  - Game board is 3x3 rectangle
  - First mover will be random by contract
  - First player to complete a row or diagonal of either X's or O's wins the game.
  - When playing with bot, the contract will call the orgn.wax contract to get random number
  - The winner of the game will get a reward of 10 TIC token (the token issued by the game)

## 2. Understanding the Game
 For a basic game like tictactoe, we can visualize the game would have these actions:
 - create: create a new game
 - move: move by an user if it's his turn
 - close: clear the game by the host
 - restart: restart the game

Game logic will follow below diagrams:

- Creating new game:
  
  <img src="./images/Tictactoe-new.png"/>


- Player vs Player mode:
  
  <img src="./images/Tictactoe-pvp.png"/>

- Player vs Bot:
  
  <img src="./images/Tictactoe-bot.png"/>
 

## 3. Tic-tac-toe Smart Contract
Let dive into how can we implement these actions on tictactoe smartcontract.

The smartcontract will have the [tictactoe.hpp header file](../include/tictactoe.hpp) and the [tictactoe.cpp implementation file](../src/tictactoe.cpp). 

Let's put these declarations in header file, this is the main action of our smartcontract:

```
  ACTION init();
  ACTION create(const name &challenger,const name &host);
  ACTION restart(uint64_t game_id, const name &by);
  ACTION close(uint64_t game_id);
  ACTION move(uint64_t game_id, const name &by, const uint16_t &row, const uint16_t &column);
```

and the game table to store the game data:
```
 TABLE game
  {
    static constexpr uint16_t boardWidth = 3;
    static constexpr uint16_t boardHeight = boardWidth;

    uint64_t id;
    name challenger;
    name host;
    name turn;
    name winner = "none"_n;
    std::vector<uint8_t> board;
    uint64_t primary_key() const { return id; }

    void initializeBoard() { board.assign(boardWidth * boardHeight, 0); }

    void resetGame()
    {
      initializeBoard();
      turn = host;
      winner = "none"_n;
    }
  };
  typedef multi_index<"games"_n, game> games;

```

Look at here we can see the data structure to store the game. Each game will have a 'host', player which create the game, 'challenger' the other player and a 'board' which store all the moves. Other variable here are 'turn' to indicate which player can move now, and 'winner' to store result of the game.

The game board is two dimensionals array, but on the game table we'll use one dimension to represent the board. For example this board:

| Row  | 0 | 1 | 2 |
|------|---|---|---|
|   0  | 1 | 2 | 1 |
|   1  | 1 | 2 | 2 |
|   2  | 2 | 1 | 1 |

Will be represented as  [1, 2, 1, 1, 2, 2, 2, 1, 1].

### Contract actions:

- init(): This action is used to init table and singleton in the smartcontract. We need to call this action right after deployment for the contract to have initial data we want.
- create(): This action launches a new game and creates a new game board array. Create action will have params that allow the host to choose the challenger. We define that when the challenger is tiactactoe name( the contract name itself) then the host want to play with bot.
- restart(): This action clears data from an existing game board array.
- close(): This action deletes and removes existing game data and frees up any storage the game uses. 
- move(): This action sets a marker on the gameboard and updates the game board array.

#### Get random number for first turn

We talked about using random number from orgn.wax contract to randomize who taking the first turn. In order to do that, in the create() action to create a game we'll have to make a call to the orng.wax contract:

```
   action(
        {get_self(), "active"_n},
        "orng.wax"_n, "requestrand"_n,
        std::tuple(game_id, turn_count, get_self()))
        .send();        
```
This action send a **requestrand** command to the orng.wax contract then we'll wait for the callback to get our random number.

The declaration of requestrand on orng.wax is below. We will pass the game_id as assoc_id as this value will be on the callback and let us know which corresponded game_id need the random number.
```
ACTION orng::requestrand(uint64_t assoc_id,
                         uint64_t signing_value,
                         const name& caller)
```

The call back will invoke a predefined action on our contract, which is **receiverand**. We have to implement this action with correct interface to allow orng.wax callback into our contract:

```
void tictactoe::receiverand(uint64_t assoc_id, const eosio::checksum256 &random_value)
{
  require_auth("orng.wax"_n);
  uint64_t result = _hash_to_int(random_value);
  games existingHostGames(get_self(), get_self().value);
  auto itr = existingHostGames.find(assoc_id);
  check(itr != existingHostGames.end(), "Game does not exist.");
  if (itr->turn == "none"_n){
    uint64_t move = result % 2;
    if (move == 0) {
      existingHostGames.modify(itr, get_self(), [&](auto &g) { g.turn = itr->host; });
    } else {
      existingHostGames.modify(itr, get_self(), [&](auto &g) { g.turn = itr->challenger; });
    }
  }
  // other code ...
}
```
So here when received the **random_value** we'll convert it into a uint64_t number, then simply apply it to decide who is the first turner. If this is even number then the turn is host, if it is odd then challenger is the first turner.

You can take a look at the random number contract of WAX here https://github.com/worldwide-asset-exchange/wax-orng. All you need to do is call the action **requestrand** and listen for the result on **receiverand**.

One important note about **requestrand** action is the parameter **signing_value**, it should be diffrent for all call. One simple way to get a random seed is using the transaction hash.

```
  const auto &tx_hash = _get_transaction_hash();
  auto next_seed = _hash_to_int(tx_hash);
```

#### Move action

Let take a look into the **move** action, which is main logic of our game.
This action take the move by a player with row and column as cordiation on the board. We'll check for validity of the move then save it to the game.

```
 // Check if user makes a valid movement
  check(isValidMove(row, column, itr->board), "Not a valid movement.");

  // Fill the cell, 1 for host, 2 for challenger
  // TODO could use constant for 1 and 2 as well
  const uint8_t cellValue = itr->turn == itr->host ? 1 : 2;
  const auto turn = itr->turn == itr->host ? itr->challenger : itr->host;
  auto gameBoard = *itr;
  gameBoard.board[row * game::boardWidth + column] = cellValue;
  auto winner = getWinner(gameBoard);
  auto turn_count = _next_seed();
  existingHostGames.modify(itr, by, [&](auto &g) {
    g.board[row * game::boardWidth + column] = cellValue;
    g.turn = turn;
    g.winner = winner;
  });
```

One important logic here is checking for the winner:

- If the game has a winner, the the game is stopped and not accepting new move. An amount of TIC token is sent to the winner.
- If the game has not stopped, we'll update the turn for next player. If the next player is bot, then we'll request next move by a random number.

You can see we request the next random number and process the result in **receiverand** action. With a random number we received, we calculate a valid next move and continue to call move on be half of the bot (which is the game contract itself).


## TIC Token Smartcontract

The game cover a logic when we found the winner, we'll reward him with an amount of TIC token. You can use this logic to issue game's token, let player trade and buy in-game item,...

You can follow the tutorial on eosio issuing new token here: https://developers.eos.io/manuals/eosio.contracts/latest/guides/how-to-create-issue-and-transfer-a-token/.

After deploy the token, you'll have to create new token name TIC and issue a predefined amount of token to the game contract. After that, the game can transfer token to the winner.

```
cleos push action tic.token create '["tictactoe","1000000.0000 TIC"]' -p tic.token@active
cleos push action tic.token issue '["tictactoe","1000000.0000 TIC","issue token"]' -p tictactoe@active
```

