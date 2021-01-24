// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "./Poseidon.sol";

uint256 constant MERKLE_DEPTH = 20;
uint256 constant MERKLE_LEAVES = 1 << MERKLE_DEPTH;

library MerkleTree {
    struct Data {
        Poseidon hasher;
        mapping(bytes32 => bool) roots;
        mapping(uint256 => bytes32) tree;
        uint256 numLeaves;
    }

    function insert(Data storage self, bytes32 value)
        internal
        returns (uint256 index)
    {
        require(self.numLeaves < MERKLE_LEAVES, "Slots exhausted");

        index = self.numLeaves;
        self.numLeaves++;

        uint256 node = MERKLE_LEAVES + index;
        self.tree[node] = value;

        while (node > 1) {
            node /= 2;
            self.tree[node] = self.hasher.poseidon(
                [self.tree[node * 2], self.tree[node * 2 + 1]]
            );
        }

        self.roots[self.tree[1]] = true;
    }

    function getPath(Data storage self, uint256 index)
        internal
        view
        returns (bytes32[MERKLE_DEPTH] memory hashes)
    {
        require(index < self.numLeaves, "Index out of bounds");

        uint256 node = MERKLE_LEAVES + index;

        for (uint256 i = 0; i < MERKLE_DEPTH; i++) {
            hashes[i] = self.tree[node ^ 1];
            node /= 2;
        }
    }
}
