const circomlib = require("circomlib");
const groth16 = require("snarkjs").groth16;
const MixerHub = artifacts.require("MixerHub");
const Mixer = artifacts.require("Mixer");

function toBytes32(val) {
    return web3.utils.padLeft(web3.utils.toHex(val), 64);
}

function poseidon(...args) {
    return toBytes32(circomlib.poseidon(args).toString());
}

async function withdraw(info) {
    const merklePath = await info.mixer.getMerklePath(info.index);
    const ctx = await info.mixer.getContextHash(
        info.recipent,
        info.relayer,
        info.fee
    );

    const inputData = {
        nullifier: info.nullifier,
        trapdoor: info.trapdoor,
        units: info.units,
        merklePos: info.index,
        merklePath: merklePath,
        currentUnit: info.currentUnit,
        context: ctx,
    };

    const { proof, publicSignals } = await groth16.fullProve(
        inputData,
        "build/circuits/Membership.wasm",
        "build/circuits/Membership.zkey"
    );

    const args = {
        address: info.mixer.address,
        recipent: info.recipent,
        relayer: info.relayer,
        relayerFee: info.fee,
        merkleRoot: toBytes32(publicSignals[0]),
        unitNullifier: toBytes32(publicSignals[1]),
        proof: [
            proof.pi_a[0],
            proof.pi_a[1],
            proof.pi_b[0][1],
            proof.pi_b[0][0],
            proof.pi_b[1][1],
            proof.pi_b[1][0],
            proof.pi_c[0],
            proof.pi_c[1],
        ].map((s) => toBytes32(s)),
    };

    return await info.mixer.withdraw(args, { from: info.account });
}

contract("Mixer", (accounts) => {
    const denomination = "100000000000000000";

    before(async () => {
        const hub = await MixerHub.deployed();
        this.mixer = await Mixer.at(await hub.getMixer(denomination));
        this.nullifier = toBytes32("0x123");
        this.trapdoor = toBytes32("0x456");
        this.note = poseidon(this.nullifier, this.trapdoor);
    });

    it("should have valid denomination", async () => {
        assert.equal(
            (await this.mixer.denomination()).toString(),
            denomination
        );
    });

    it("should have 2^20 slots", async () => {
        assert.equal((await this.mixer.maxSlots()).toString(), "1048576");
    });

    it("should be initially empty", async () => {
        assert.equal((await this.mixer.currentUnits()).toString(), "0");
        assert.equal((await this.mixer.anonymitySet()).toString(), "0");
        assert.equal((await this.mixer.usedSlots()).toString(), "0");
    });

    it("deposit should reject notes outside BN128 scalar field", async () => {
        try {
            await this.mixer.deposit(
                "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001",
                { value: denomination }
            );
            assert.fail("Mixer should throw an exception");
        } catch (e) {
            assert.equal(
                e.message,
                "Returned error: VM Exception while processing transaction: revert Invalid note -- Reason given: Invalid note."
            );
        }
        assert.equal((await this.mixer.usedSlots()).toString(), "0");
    });

    it("deposit should reject 0 ETH", async () => {
        try {
            await this.mixer.deposit("0x123", { value: 0 });
            assert.fail("Mixer should throw an exception");
        } catch (e) {
            assert.equal(
                e.message,
                "Returned error: VM Exception while processing transaction: revert Not enough funds sent -- Reason given: Not enough funds sent."
            );
        }
        assert.equal((await this.mixer.usedSlots()).toString(), "0");
    });

    it("deposit should reject non-multiple of denomination", async () => {
        try {
            await this.mixer.deposit("0x123", {
                value: "100000000000000001",
            });
            assert.fail("Mixer should throw an exception");
        } catch (e) {
            assert.equal(
                e.message,
                "Returned error: VM Exception while processing transaction: revert Value needs to be exact multiple of denomination -- Reason given: Value needs to be exact multiple of denomination."
            );
        }
        assert.equal((await this.mixer.usedSlots()).toString(), "0");
    });

    it("deposit works for valid note", async () => {
        await this.mixer.deposit(this.note, {
            value: denomination,
        });
        assert.equal((await this.mixer.currentUnits()).toString(), "1");
        assert.equal((await this.mixer.anonymitySet()).toString(), "1");
        assert.equal((await this.mixer.usedSlots()).toString(), "1");
    });

    it("withdraw", async () => {
        const before0 = web3.utils.toBN(await web3.eth.getBalance(accounts[0]));
        const before1 = web3.utils.toBN(await web3.eth.getBalance(accounts[1]));

        const trans = await withdraw({
            mixer: this.mixer,
            nullifier: this.nullifier,
            trapdoor: this.trapdoor,
            index: "0",
            recipent: accounts[1],
            relayer: accounts[0],
            fee: "1000",
            currentUnit: "0",
            units: "1",
            account: accounts[0],
        });

        const after0 = web3.utils.toBN(await web3.eth.getBalance(accounts[0]));
        const after1 = web3.utils.toBN(await web3.eth.getBalance(accounts[1]));

        const delta0 = after0
            .sub(before0)
            .umod(web3.utils.toBN("100000"))
            .toString();
        const delta1 = after1.sub(before1).toString();

        assert.equal(delta0, "1000");
        assert.equal(delta1, "99999999999999000");
    });
});
