// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "./MerkleTree.sol";
import "./MembershipVerifier.sol";

uint256 constant BN128_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

contract Mixer {
    using MerkleTree for MerkleTree.Data;

    struct WithdrawProof {
        address payable recipent;
        uint256 relayerFee;
        bytes32 merkleRoot;
        bytes32 unitNullifier;
        bytes32[8] proof;
    }

    MembershipVerifier internal verifier;
    MerkleTree.Data internal merkleTree;
    mapping(bytes32 => bool) public withdrawn;
    uint256 public denomination;
    uint256 public currentUnits;
    uint256 public anonymitySet;

    event Deposit(bytes32 note, uint256 index, uint256 units);
    event Withdrawal(bytes32 unitNullifier);

    constructor(
        address poseidonAddr,
        address verifierAddr,
        uint256 denomination_
    ) {
        verifier = MembershipVerifier(verifierAddr);
        merkleTree.hasher = Poseidon(poseidonAddr);
        denomination = denomination_;
    }

    function deposit(bytes32 note) public payable {
        require(uint256(note) < BN128_SCALAR_FIELD, "Invalid note");
        require(msg.value >= denomination, "Not enough funds sent");
        require(
            msg.value % denomination == 0,
            "Value needs to be exact multiple of denomination"
        );

        uint256 units = msg.value / denomination;
        bytes32 leaf = merkleTree.hasher.poseidon([note, bytes32(units)]);
        uint256 index = merkleTree.insert(leaf);
        currentUnits += units;
        anonymitySet++;
        emit Deposit(note, index, units);
    }

    function withdraw(WithdrawProof calldata args) public {
        require(args.relayerFee <= denomination, "Invalid relayer fee");
        require(merkleTree.roots[args.merkleRoot], "Invalid merkle tree root");
        require(
            !withdrawn[args.unitNullifier],
            "Deposit has been already withdrawn"
        );

        require(
            verifyMembershipProof(
                args.proof,
                args.merkleRoot,
                args.unitNullifier,
                getContextHash(args.recipent, msg.sender, args.relayerFee)
            ),
            "Invalid deposit proof"
        );

        withdrawn[args.unitNullifier] = true;
        currentUnits--;

        if (currentUnits == 0) {
            anonymitySet = 0;
        }

        args.recipent.transfer(denomination - args.relayerFee);
        payable(msg.sender).transfer(args.relayerFee);
        emit Withdrawal(args.unitNullifier);
    }

    function getMerklePath(uint256 index)
        public
        view
        returns (bytes32[MERKLE_DEPTH] memory)
    {
        return merkleTree.getPath(index);
    }

    function getContextHash(
        address recipent,
        address relayer,
        uint256 fee
    ) public pure returns (bytes32) {
        // We cut 3 bits in order to fit in the BN128 scalar field
        return keccak256(abi.encode(recipent, relayer, fee)) >> 3;
    }

    function maxSlots() public pure returns (uint256) {
        return MERKLE_LEAVES;
    }

    function usedSlots() public view returns (uint256) {
        return merkleTree.numLeaves;
    }

    function verifyMembershipProof(
        bytes32[8] memory proof,
        bytes32 merkleRoot,
        bytes32 unitNullifier,
        bytes32 context
    ) internal view returns (bool) {
        uint256[2] memory a = [uint256(proof[0]), uint256(proof[1])];
        uint256[2][2] memory b =
            [
                [uint256(proof[2]), uint256(proof[3])],
                [uint256(proof[4]), uint256(proof[5])]
            ];
        uint256[2] memory c = [uint256(proof[6]), uint256(proof[7])];
        uint256[3] memory input =
            [uint256(merkleRoot), uint256(unitNullifier), uint256(context)];
        return verifier.verifyProof(a, b, c, input);
    }
}
