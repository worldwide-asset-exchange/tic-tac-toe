SHELL:= /bin/bash

CONTRACT_NAME=tictactoe
TOKEN_CONTRACT=token
BUILD_DEFS=

CLEOS=cleos -u http://127.0.0.1:8888

clean: clean-build reset-wallet stop-local-chain

clean-build:
	-rm -rf build
	-rm -rf ./tmp

reset-wallet:
	-rm ~/eosio-wallet/wallet.lock
	-rm ~/eosio-wallet/temp.wallet
	-rm ~/eosio-wallet/keosd.sock

make-build-dir:
	-mkdir -p ./build

build-production: make-build-dir
	cd ./build && \
	cdt-cpp ${BUILD_DEFS} -abigen ../src/${CONTRACT_NAME}.cpp -o ./${CONTRACT_NAME}.wasm  -I ../include/

build-local: make-build-dir
	cd ./build && \
	cdt-cpp -D LOCAL_DEV ${BUILD_DEFS} ../src/${CONTRACT_NAME}.cpp -o ./${CONTRACT_NAME}.wasm -I ../include/ -abigen && \
	cdt-cpp -D LOCAL_DEV ${BUILD_DEFS} ../src/${TOKEN_CONTRACT}.cpp -o ./${TOKEN_CONTRACT}.wasm -I ../include/ -abigen

build-dev: make-build-dir
	eosio-cpp -D LOCAL_DEV ${BUILD_DEFS} ./src/${CONTRACT_NAME}.cpp -o ./build/${CONTRACT_NAME}.wasm -I ./include/ -abigen_output ./build/app/app.abi && \
	eosio-cpp -D LOCAL_DEV ${BUILD_DEFS} ./src/${TOKEN_CONTRACT}.cpp -o ./build/${TOKEN_CONTRACT}.wasm -I ./include/ -abigen_output ./build/app/app.abi

##############################
# Prod-deploy related tasks
##############################

deploy-wax-staging:
	cleos -u "http://chain.stg" set contract managed ./build/ "${CONTRACT_NAME}.wasm" "${CONTRACT_NAME}.abi" -p "${CONTRACT_NAME}@active"

deploy-wax-mainnet:
	cleos -u "https://chain.wax.io" set contract managed ./build/ "${CONTRACT_NAME}.wasm" "${CONTRACT_NAME}.abi" -p "${CONTRACT_NAME}@active"
