#include <eosio/asset.hpp>
#include <eosio/crypto.hpp>
#include <eosio/eosio.hpp>
#include <eosio/system.hpp>
#include <eosio/transaction.hpp>
#include <eosio/singleton.hpp>

using namespace eosio;
using namespace std;

const eosio::name TOKEN_CONTRACT = "tic.token"_n;
const eosio::symbol TIC_SYMBOL{"TIC", 4};

const eosio::name PLAYER_BOT= "tictactoe"_n;

uint64_t _hash_to_int(const checksum256 &value)
{
  auto byte_array = value.extract_as_byte_array();
  uint64_t int_value = 0;
  for (int i = 0; i < 8; i++) {
    int_value <<= 8;
    int_value |= byte_array[i] & 127;
  }
  return int_value;
}

uint64_t game_index(const name &host, const name &challenger)
{
  // collision is hard to happen because this table just a few item
  auto str = host.to_string() + "_" + challenger.to_string();
  return _hash_to_int(sha256(const_cast<char *>(str.c_str()), str.size()));
};

uint64_t signing_value(uint64_t seed)
{
  auto str = "tictactoe_seed_value_" + to_string(seed);
  return _hash_to_int(sha256(const_cast<char *>(str.c_str()), str.size()));
};

static eosio::checksum256 _get_transaction_hash()
{
  size_t size = eosio::transaction_size();
  char buf[size];
  uint32_t read = eosio::read_transaction(buf, size);
  eosio::check(size == read, "read_transaction() has failed.");
  return eosio::sha256(buf, read);
}



CONTRACT tictactoe : public contract
{
 public:
  using contract::contract;
  tictactoe(name receiver, name code, datastream<const char *> ds) : contract(receiver, code, ds){}

  ACTION init();
  ACTION create(const name &challenger,const name &host);
  ACTION restart(uint64_t game_id, const name &by);
  ACTION close(uint64_t game_id);
  ACTION move(uint64_t game_id, const name &by, const uint16_t &row, const uint16_t &column);

  ACTION receiverand(uint64_t assoc_id, const eosio::checksum256& random_value);
 private:

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


  bool isEmptyCell(const uint8_t &cell);
  bool isValidMove(const uint16_t &row, const uint16_t &column, const std::vector<uint8_t> &board);
  name getWinner(const game &currentGame);
  // uint64_t _next_seed();
};