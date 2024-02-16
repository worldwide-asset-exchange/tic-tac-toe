#run the wax chain docker
echo 'Starting wax chain docker'
docker stop qtest-local
docker rm qtest-local
docker run --name qtest-local --env SYSTEM_TOKEN_SYMBOL=WAX -d -p 8801:8888 songmai108/qtest:v4.0.4
echo 'Wait for chain initialization...'
sleep 15

export CONTRACTS_DIR=build
export TESTING_KEY=5JKxAqBoQuAYSh6YMcjxcougPpt1pi9L4PyJHwEQuZgYYgkWpjS 
export CLEOS='cleos -u http://localhost:8801'
rm ~/eosio-wallet/temp.wallet
${CLEOS} wallet create -n temp --to-console
${CLEOS} wallet import -n temp --private-key ${TESTING_KEY}
${CLEOS} wallet keys
${CLEOS} get info

#create account
${CLEOS} system newaccount eosio testacc1 EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH --stake-net "100.00000000 WAX" --stake-cpu "100.00000000 WAX" --buy-ram-kbytes 4 -p eosio

${CLEOS} get account testacc1

#deploy contract tictactoe

${CLEOS} system newaccount eosio tictactoe EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH --stake-net "1000.00000000 WAX" --stake-cpu "1000.00000000 WAX" --buy-ram-kbytes 1024 -p eosio

${CLEOS} set contract tictactoe ${CONTRACTS_DIR} tictactoe.wasm tictactoe.abi
${CLEOS} set account permission tictactoe active --add-code
${CLEOS} push action tictactoe init '[12345]' -p tictactoe@active


#deploy contract token tic
${CLEOS} system newaccount eosio tic.token EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH --stake-net "1000.00000000 WAX" --stake-cpu "1000.00000000 WAX" --buy-ram-kbytes 1024 -p eosio

${CLEOS} set contract tic.token ${CONTRACTS_DIR} token.wasm token.abi
${CLEOS} set account permission tic.token active --add-code

${CLEOS} push action tic.token create '["tictactoe","1000000.0000 TIC"]' -p tic.token@active

${CLEOS} push action tic.token issue '["tictactoe","1000000.0000 TIC", "issue token"]' -p tictactoe@active

#check game balance
${CLEOS} get table tic.token tictactoe accounts

# deploy orgn contract

${CLEOS} system newaccount eosio orng.wax EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH --stake-net "1000.00000000 WAX" --stake-cpu "1000.00000000 WAX" --buy-ram-kbytes 1024 -p eosio

${CLEOS} system newaccount eosio oracle.wax EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH --stake-net "1000.00000000 WAX" --stake-cpu "1000.00000000 WAX" --buy-ram-kbytes 1024 -p eosio


${CLEOS} system newaccount eosio oraclev1.wax EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH EOS5dUsCQCAyHVjnqr6BFqVEE7w8XksnkRtz22wd9eFrSq4NHoKEH --stake-net "1000.00000000 WAX" --stake-cpu "1000.00000000 WAX" --buy-ram-kbytes 1024 -p eosio

${CLEOS} set contract orng.wax tests/artifacts/ wax.orng.wasm wax.orng.abi
${CLEOS} set account permission orng.wax active --add-code
${CLEOS} set account permission oraclev1.wax active orng.wax --add-code

${CLEOS} get account oraclev1.wax

${CLEOS} push action orng.wax setsigpubkey '[0,10001, "c61c159689a0bddad3b3855e29f996c91d358f8735d653272565957f9b184f4312b6fe1604adacbcbc9af99a8a9cebfeabd3e93fff3b1e5c7e7a95567e1671dd2b09e868dc54763cd3ecac29d0cb1bcf2a5b4ad39455f273a0d91c4adba1ddf8a79e49f9ca48b6c3f8a2280702317c213548d0ee24c2ec2a0fb8ff31196601cb988316dd0bb7830f8702a216e8369167c0a7a22336232a2291a26f1f2811a2ed81e02da627e07315c89ae376f3a7112b73c8661ab64411c99cdc80b77ce373edfd5e17a44a737e4321db373bcf87091ad02a64a09be58b7ad4d8610b58b018bc6c5136150746f2b7d0a83f2832caaafb2b9f30b5e978fe27974d36d2e9334b0eb7c739bda9e212e413ab8b05f4f42ab2d0447b2b152ae02901a3c755bc44ae494f3ee094643c6cc44f0e5a1d7e4220abb62ee595576e94c27e299fe7cb0568b11d638b7a4a8f332c626d704f3d38bf3ae7c2c9f265bac26611df6a7988b15bc8d743bac8f98d6de8fc68d3b6a46a563ffff4f3b58f90fea9fc96223bcf022083562fa69c810641f8d9d4e6ed9e4cfad24f2424d5cbaef058d8fbbd2b44ce59b5f1f2a5ca89f4c0801da6c816611fc6131e9741471bb49bdec6a78ab0559fa4b324f538ad34a0c1ac74a8fee99a7f73b0564312f3473ccd78354b15211d8d8136c31dd2ab1a566c95bcbf2c6e1c1870cb79562e9a9d5e7cabf96e45f37ac3e9c1"]' -p oracle.wax@active

${CLEOS} push action orng.wax setchance '[10]' -p oracle.wax@active

## test create new game
# ${CLEOS} push action tictactoe create '["tictactoe", "testacc1"]' -p testacc1@active
node ./local-node/simple-oracle.js
