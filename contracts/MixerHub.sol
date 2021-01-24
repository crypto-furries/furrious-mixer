// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "./Mixer.sol";

contract MixerHub {
    struct Entry {
        uint256 index;
        address addr;
    }

    address public owner = msg.sender;
    address public poseidon;
    address public verifier;

    uint256[] internal denominations;
    mapping(uint256 => Entry) internal mixers;

    event MixerDeployed(uint256 denomination, address addr);
    event MixerRemoved(uint256 denomination, address addr);

    constructor(address poseidon_, address verifier_) {
        poseidon = poseidon_;
        verifier = verifier_;
    }

    modifier restricted() {
        require(
            msg.sender == owner,
            "This function is restricted to the contract's owner"
        );
        _;
    }

    function createOrReplaceMixer(uint256 denomination) public restricted {
        Mixer newMixer = new Mixer(poseidon, verifier, denomination);
        Entry storage entry = mixers[denomination];

        if (entry.addr == address(0)) {
            entry.index = denominations.length;
            denominations.push(denomination);
        }

        entry.addr = address(newMixer);
        emit MixerDeployed(denomination, address(newMixer));
    }

    function removeMixer(uint256 denomination) public restricted {
        Entry storage entry = mixers[denomination];
        require(
            entry.addr != address(0),
            "Mixer with given denomination doesn't exist"
        );

        uint256 last = denominations[denominations.length - 1];
        denominations[entry.index] = last;
        mixers[last].index = entry.index;
        denominations.pop();

        emit MixerRemoved(denomination, entry.addr);
        delete mixers[denomination];
    }

    function getDenominations() public view returns (uint256[] memory) {
        return denominations;
    }

    function getMixer(uint256 denomination) public view returns (address) {
        return mixers[denomination].addr;
    }
}
