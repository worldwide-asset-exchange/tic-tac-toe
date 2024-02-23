#include <math.h>

#include <tictactoe.hpp>

void tictactoe::init(){
   require_auth(get_self());
}

void tictactoe::create(const name &challenger,const name &host)
{
  require_auth(host);
  check(challenger != host, "Challenger should not be the same as the host.");
  auto game_id = game_index(host, challenger);
  // Check if game already exists
  games existingHostGames(get_self(), get_self().value);
  auto itr = existingHostGames.find(game_id);
  check(itr == existingHostGames.end(), "Game already exists.");
  const auto &tx_hash = _get_transaction_hash();
  auto random_seed = _hash_to_int(tx_hash);
  // charge ram for user hosting the game
  existingHostGames.emplace(host, [&](auto &g) {
    g.id = game_id;
    g.challenger = challenger;
    g.host = host;
    g.turn = "none"_n;
    g.initializeBoard();
  });
  
    action(
        {get_self(), "active"_n},
        "orng.wax"_n, "requestrand"_n,
        std::tuple(game_id, random_seed, get_self()))
        .send();
}

// receive a random value then use it to determine who will start the game
// assoc_id is game_id
void tictactoe::receiverand(uint64_t assoc_id, const eosio::checksum256 &random_value)
{
  //Important: without this require_auth, the action will be executed by anyone
  require_auth("orng.wax"_n);
  uint64_t result = _hash_to_int(random_value);
  games existingHostGames(get_self(), get_self().value);
  auto itr = existingHostGames.find(assoc_id);
  check(itr != existingHostGames.end(), "Game does not exist.");
  
  if (itr->turn == "none"_n){
    uint64_t move = result % 2;
    if (move == 0) {
      existingHostGames.modify(itr, get_self(), [&](auto &g) { 
        g.turn = itr->host; 
      });
    } else {
      existingHostGames.modify(itr, get_self(), [&](auto &g) { 
        g.turn = itr->challenger; 
      });
      if (itr->challenger == PLAYER_BOT){
          const auto &tx_hash = _get_transaction_hash();
          auto next_seed = _hash_to_int(tx_hash);
          action(
            {get_self(), "active"_n},
            "orng.wax"_n, "requestrand"_n,
            std::tuple(assoc_id, next_seed, get_self()))
          .send();
      }
    }
  }else{
    // bot_move(assoc_id, result);
    check(itr->winner == "none"_n, "The game has ended.");
    check(itr->turn == PLAYER_BOT, "it's not bot turn yet!");
    // Check if user makes a valid movement
    uint16_t x = uint16_t(result / game::boardWidth);
    uint16_t y = uint16_t(result % game::boardWidth);
    for (uint32_t i = 0; i < itr->board.size(); i++) {
      uint16_t dx = uint16_t(i / game::boardWidth);
      uint16_t dy = uint16_t(i % game::boardWidth);
      uint16_t row = (x + dx) % game::boardWidth;
      uint16_t column = (y + dy) % game::boardWidth;
      if (isValidMove(row, column, itr->board)){
          action(
              {get_self(), "active"_n},
              get_self(), "move"_n,
              std::tuple(assoc_id, PLAYER_BOT, row, column))
            .send();
        break;
      }
    }
  }
}

void tictactoe::restart(uint64_t game_id, const name &by)
{
  check(has_auth(by), "Only " + by.to_string() + "can restart the game.");

  // Check if game exists
  games existingHostGames(get_self(), get_self().value);
  auto itr = existingHostGames.find(game_id);
  check(itr != existingHostGames.end(), "Game does not exist.");

  // Check if this game belongs to the action sender
  check(by == itr->host || by == itr->challenger, "This is not your game.");

  // Reset game
  existingHostGames.modify(itr, itr->host, [](auto &g) { g.resetGame(); });
}

void tictactoe::close(uint64_t game_id)
{
  // Check if game exists
  games existingHostGames(get_self(), get_self().value);
  auto itr = existingHostGames.find(game_id);
  check(itr != existingHostGames.end(), "Game does not exist.");
  check(has_auth(itr->host), "Only the host can close the game.");
  // Remove game
  existingHostGames.erase(itr);
}

bool tictactoe::isEmptyCell(const uint8_t &cell) { return cell == 0; }

bool tictactoe::isValidMove(const uint16_t &row, const uint16_t &column, const std::vector<uint8_t> &board)
{
  uint32_t movementLocation = row * game::boardWidth + column;
  bool isValid = movementLocation < board.size() && isEmptyCell(board[movementLocation]);
  return isValid;
}

name tictactoe::getWinner(const game &currentGame)
{
  auto &board = currentGame.board;

  bool isBoardFull = true;

  // Use bitwise AND operator to determine the consecutive values of each column, row and diagonal
  // Since 3 == 0b11, 2 == 0b10, 1 = 0b01, 0 = 0b00
  std::vector<uint32_t> consecutiveColumn(game::boardWidth, 3);
  std::vector<uint32_t> consecutiveRow(game::boardHeight, 3);
  uint32_t consecutiveDiagonalBackslash = 3;
  uint32_t consecutiveDiagonalSlash = 3;

  for (uint32_t i = 0; i < board.size(); i++) {
    isBoardFull &= isEmptyCell(board[i]);
    uint16_t row = uint16_t(i / game::boardWidth);
    uint16_t column = uint16_t(i % game::boardWidth);

    // Calculate consecutive row and column value
    consecutiveRow[column] = consecutiveRow[column] & board[i];
    consecutiveColumn[row] = consecutiveColumn[row] & board[i];
    // Calculate consecutive diagonal \ value
    if (row == column) {
      consecutiveDiagonalBackslash = consecutiveDiagonalBackslash & board[i];
    }
    // Calculate consecutive diagonal / value
    if (row + column == game::boardWidth - 1) {
      consecutiveDiagonalSlash = consecutiveDiagonalSlash & board[i];
    }
  }

  // Inspect the value of all consecutive row, column, and diagonal and determine winner
  std::vector<uint32_t> aggregate = {consecutiveDiagonalBackslash, consecutiveDiagonalSlash};
  aggregate.insert(aggregate.end(), consecutiveColumn.begin(), consecutiveColumn.end());
  aggregate.insert(aggregate.end(), consecutiveRow.begin(), consecutiveRow.end());

  for (auto value : aggregate) {
    if (value == 1) {
      return currentGame.host;
    } else if (value == 2) {
      return currentGame.challenger;
    }
  }
  // Draw if the board is full, otherwise the winner is not determined yet
  return isBoardFull ? "draw"_n : "none"_n;
}

void tictactoe::move(uint64_t game_id, const name &by, const uint16_t &row, const uint16_t &column)
{
  check(has_auth(by), "The next move should be made by " + by.to_string());

  // Check if game exists
  games existingHostGames(get_self(), get_self().value);
  auto itr = existingHostGames.find(game_id);
  check(itr != existingHostGames.end(), "Game does not exist.");

  // Check if this game hasn't ended yet
  check(itr->winner == "none"_n, "The game has ended.");

  // Check if this game belongs to the action sender
  check(by == itr->host || by == itr->challenger, "This is not your game.");
  // Check if this is the  action sender's turn
  check(by == itr->turn, "it's not your turn yet!");

  // Check if user makes a valid movement
  check(isValidMove(row, column, itr->board), "Not a valid movement.");

  // Fill the cell, 1 for host, 2 for challenger
  // TODO could use constant for 1 and 2 as well
  const uint8_t cellValue = itr->turn == itr->host ? 1 : 2;
  const auto turn = itr->turn == itr->host ? itr->challenger : itr->host;
  auto gameBoard = *itr;
  gameBoard.board[row * game::boardWidth + column] = cellValue;
  auto winner = getWinner(gameBoard);
  
  // charge ram for user making move
  existingHostGames.modify(itr, by, [&](auto &g) {
    g.board[row * game::boardWidth + column] = cellValue;
    g.turn = turn;
    g.winner = winner;
  });

  if (winner != "none"_n){
    // check(winner == "ok"_n, "Winner:" + winner.to_string());
    auto payout = asset(100000, TIC_SYMBOL);
    string memo = "payout";
    if (winner == itr->host){
        eosio::action(eosio::permission_level{get_self(), eosio::name("active")}, TOKEN_CONTRACT, eosio::name("transfer"),
          make_tuple(get_self(), itr->host, payout, memo))
                .send();
    }else if (winner == itr->challenger && itr->challenger != PLAYER_BOT){
        eosio::action(eosio::permission_level{get_self(), eosio::name("active")}, TOKEN_CONTRACT, eosio::name("transfer"),
          make_tuple(get_self(), itr->challenger, payout, memo))
                .send();
    }
  }else{
    if (turn == PLAYER_BOT){
        const auto &tx_hash = _get_transaction_hash();
        auto next_seed = _hash_to_int(tx_hash);
        action(
            {get_self(), "active"_n},
            "orng.wax"_n, "requestrand"_n,
            std::tuple(game_id, next_seed, get_self()))
          .send();
    }
  }
}