const MixerHub = artifacts.require("MixerHub");
const Mixer = artifacts.require("Mixer");

const defaultDenominations = [
    "100000000000000000",
    "1000000000000000000",
    "10000000000000000000",
    "100000000000000000000",
    "1000000000000000000000",
];

async function getDenominations(hub) {
    const elems = await hub.getDenominations();
    return elems.sort((a, b) => a.gt(b) - a.lt(b)).map((d) => d.toString());
}

async function checkIntegrity(hub, expectedDenominations) {
    const denominations = await getDenominations(hub);
    assert.deepStrictEqual(denominations, expectedDenominations);

    for (let denom of denominations) {
        const mixer = await Mixer.at(await hub.getMixer(denom));
        const mixerDenom = (await mixer.denomination()).toString();
        assert.equal(denom, mixerDenom);
    }
}

contract("MixerHub", (accounts) => {
    before(async () => {
        this.hub = await MixerHub.deployed();
    });

    it("should have default denominations deployed", async () => {
        await checkIntegrity(this.hub, defaultDenominations);
    });

    it("should restrict mutation to owner", async () => {
        try {
            await this.hub.createOrReplaceMixer("100", {
                from: accounts[1],
            });
            assert.fail("MixerHub should throw an exception");
        } catch (e) {
            assert.equal(
                e.message,
                "Returned error: VM Exception while processing transaction: revert This function is restricted to the contract's owner -- Reason given: This function is restricted to the contract's owner."
            );
        }
        await checkIntegrity(this.hub, defaultDenominations);

        try {
            await this.hub.removeMixer(defaultDenominations[0], {
                from: accounts[1],
            });
            assert.fail("MixerHub should throw an exception");
        } catch (e) {
            assert.equal(
                e.message,
                "Returned error: VM Exception while processing transaction: revert This function is restricted to the contract's owner -- Reason given: This function is restricted to the contract's owner."
            );
        }
        await checkIntegrity(this.hub, defaultDenominations);
    });

    it("owner can remove mixers", async () => {
        let elems = defaultDenominations.slice();
        while (elems.length > 0) {
            await this.hub.removeMixer(elems[0]);
            elems.splice(0, 1);
            await checkIntegrity(this.hub, elems);
        }
    });

    it("owner can add mixers", async () => {
        await this.hub.createOrReplaceMixer("100");
        checkIntegrity(this.hub, ["100"]);
        await this.hub.createOrReplaceMixer("200");
        checkIntegrity(this.hub, ["100", "200"]);
    });

    it("owner can replace mixers", async () => {
        const before = await this.hub.getMixer("100");
        await this.hub.createOrReplaceMixer("100");
        checkIntegrity(this.hub, ["100", "200"]);
        const after = await this.hub.getMixer("100");
        assert.notEqual(before, after);
    });
});
