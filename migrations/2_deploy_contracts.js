const MembershipVerifier = artifacts.require("MembershipVerifier");
const Mixer = artifacts.require("Mixer");
const MixerHub = artifacts.require("MixerHub");
const PoseidonGen = require("../node_modules/circomlib/src/poseidon_gencontract.js");

module.exports = async function (deployer, network, accounts) {
    let poseidonContract = new web3.eth.Contract(PoseidonGen.generateABI(2));
    let poseidonDeployed = await poseidonContract
        .deploy({ data: PoseidonGen.createCode(2) })
        .send({ gas: 2500000, from: accounts[0] });

    await deployer.deploy(MembershipVerifier);
    await deployer.deploy(
        MixerHub,
        poseidonDeployed._address,
        MembershipVerifier.address
    );

    const hub = await MixerHub.deployed();

    for (let denom of ["0.1", "1", "10", "100", "1000"]) {
        await hub.createOrReplaceMixer(web3.utils.toWei(denom, "ether"));
    }
};
