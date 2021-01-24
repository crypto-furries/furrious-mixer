#!/bin/bash

set -e

if [ ! -f "build/circuits/powers_of_tau.ptau" ]; then
    echo 'error: powers of tau not initialized, use `npm run ptau`'
    exit 1
fi

npx circom circuits/$1.circom --r1cs build/circuits/$1.r1cs --wasm build/circuits/$1.wasm --sym build/circuits/$1.sym
npx snarkjs info build/circuits/$1.r1cs
npx snarkjs zkey new build/circuits/$1.r1cs build/circuits/powers_of_tau.ptau build/circuits/$1.zkey

npx snarkjs zkey export solidityverifier build/circuits/$1.zkey build/circuits/$1Verifier.sol
sed -i 's/^pragma solidity \^0\.6\.11\;$/pragma solidity ^0.8.0;/g' build/circuits/$1Verifier.sol
sed -i "s/contract Verifier/contract $1Verifier/g" build/circuits/$1Verifier.sol
