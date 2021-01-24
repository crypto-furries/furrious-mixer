#!/bin/bash

set -e
mkdir -p build/circuits

npx snarkjs powersoftau new bn128 $1 build/circuits/pot_0.ptau -v
npx snarkjs powersoftau contribute build/circuits/pot_0.ptau build/circuits/pot_1.ptau -v
npx snarkjs powersoftau prepare phase2 build/circuits/pot_1.ptau build/circuits/powers_of_tau.ptau -v
rm build/circuits/pot_0.ptau build/circuits/pot_1.ptau
