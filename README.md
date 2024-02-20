# Contract

This tic-tac-toe contract provides an example of building a game on WAX, complete with secure use of random values to determine game outcomes.

See the tutorial documentation [here](docs/contract.md) for a deep dive into how everything works and how to test and develop a typical game project.

The UI for this project is available [here](https://github.com/worldwide-asset-exchange/tic-tac-toe-front-end)

### Test

```
    make build
    npm run test
``

### Deployment

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
