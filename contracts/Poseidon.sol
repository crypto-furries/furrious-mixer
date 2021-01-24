// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface Poseidon {
    function poseidon(bytes32[2] memory) external pure returns (bytes32);
}
