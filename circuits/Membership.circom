include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template HashPair() {
    signal input in1;
    signal input in2;
    signal input swap;
    signal output out;

    signal tmp1 <== swap * in1;
    signal tmp2 <== swap * in2;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== in1 - tmp1 + tmp2;
    hasher.inputs[1] <== in2 - tmp2 + tmp1;
    out <== hasher.out;
}

template MerkleProof(DEPTH) {
    signal input leaf;
    signal input pos;
    signal input path[DEPTH];
    signal output root;

    signal inner[DEPTH+1];
    inner[0] <== leaf;

    component hashers[DEPTH];
    component posBits = Num2Bits(DEPTH);
    posBits.in <== pos;

    for (var i = 0; i < DEPTH; i++) {
        hashers[i] = HashPair();
        hashers[i].in1 <== inner[i];
        hashers[i].in2 <== path[i];
        hashers[i].swap <== posBits.out[i];
        inner[i+1] <== hashers[i].out;
    }

    root <== inner[DEPTH];
}

template Membership(MERKLE_DEPTH) {
    signal private input nullifier;
    signal private input trapdoor;
    signal private input units;
    signal private input merklePos;
    signal private input merklePath[MERKLE_DEPTH];
    signal private input currentUnit;
    signal input context;
    signal output merkleRoot;
    signal output unitNullifier;

    // Ensure units and currentUnit have at most 250 bits

    component unitsBits = Num2Bits(250);
    component currentUnitBits = Num2Bits(250);
    unitsBits.in <== units;
    currentUnitBits.in <== currentUnit;

    // Ensure currentUnit is between 0 and units-1

    component unitBound = LessThan(251);
    unitBound.in[0] <== currentUnit;
    unitBound.in[1] <== units;
    unitBound.out === 1;

    // Verify Merkle proof

    component noteHasher = Poseidon(2);
    noteHasher.inputs[0] <== nullifier;
    noteHasher.inputs[1] <== trapdoor;

    component leafHasher = Poseidon(2);
    leafHasher.inputs[0] <== noteHasher.out;
    leafHasher.inputs[1] <== units;

    component merkleProof = MerkleProof(MERKLE_DEPTH);
    merkleProof.leaf <== leafHasher.out;
    merkleProof.pos <== merklePos;

    for (var i = 0; i < MERKLE_DEPTH; i++) {
        merkleProof.path[i] <== merklePath[i];
    }

    merkleRoot <== merkleProof.root;

    // Verify nullifier hash

    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== merklePos;
    nullifierHasher.inputs[1] <== currentUnit;
    nullifierHasher.inputs[2] <== nullifier;
    unitNullifier <== nullifierHasher.out;

    // Prevent tampering with context input
    signal contextSqr <== context * context;
}

component main = Membership(20);
