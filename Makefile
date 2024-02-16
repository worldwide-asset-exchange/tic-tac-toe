SHELL:= /bin/bash

CONTRACT_NAME=tictactoe
TOKEN_CONTRACT=token
BUILD_DEFS=

clean: clean-build

clean-build:
	-rm -rf build
	-rm -rf ./tmp

make-build-dir:
	-mkdir -p ./build

build-production: make-build-dir
	cd ./build && \
	cdt-cpp ${BUILD_DEFS} -abigen ../src/${CONTRACT_NAME}.cpp -o ./${CONTRACT_NAME}.wasm  -I ../include/

build: make-build-dir
	cd ./build && \
	cdt-cpp -D LOCAL_DEV ${BUILD_DEFS} ../src/${CONTRACT_NAME}.cpp -o ./${CONTRACT_NAME}.wasm -I ../include/ -abigen && \
	cdt-cpp -D LOCAL_DEV ${BUILD_DEFS} ../src/${TOKEN_CONTRACT}.cpp -o ./${TOKEN_CONTRACT}.wasm -I ../include/ -abigen
