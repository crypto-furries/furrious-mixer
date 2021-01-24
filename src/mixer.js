const groth16 = require("snarkjs").groth16; // Can't get it to work with import...
import { toBN } from "web3-utils";
import { loadContract, poseidon, randomHexBits, toBytes32 } from "./utils";

class MixerHub {
    async connect(web3, address) {
        this.web3 = web3;
        this.contract = await loadContract(
            web3,
            address,
            "contracts/MixerHub.json"
        );
        this.owner = await this.contract.owner();
    }

    async createOrReplaceMixer(account, denomination) {
        if (account.toLowerCase() != this.owner.toLowerCase()) {
            throw new Error("Only owner can mutate mixer hub");
        }
        const result = await this.contract.createOrReplaceMixer(denomination, {
            from: account,
        });
        return result.logs[0].args[1].toString();
    }

    async removeMixer(account, denomination) {
        if (account.toLowerCase() != this.owner.toLowerCase()) {
            throw new Error("Only owner can mutate mixer hub");
        }
        const result = await this.contract.removeMixer(denomination, {
            from: account,
        });
        return result.logs[0].args[1].toString();
    }

    async getMixerAddress(denomination) {
        return (await this.contract.getMixer(denomination)).toString();
    }

    async getMixer(denomination) {
        const address = await this.getMixerAddress(denomination);
        const mixer = await connectMixer(this.web3, address);
        if (mixer.denomination != denomination) {
            throw new Error("Unexpected mixer denomination");
        }
        return mixer;
    }

    async denominations() {
        const elems = await this.contract.getDenominations();
        return elems.map((e) => e.toString());
    }
}

class Mixer {
    async connect(web3, address) {
        this.web3 = web3;
        this.contract = await loadContract(
            web3,
            address,
            "contracts/Mixer.json"
        );
        this.denomination = (await this.contract.denomination()).toString();
    }

    async deposit(account, units = 1) {
        const nullifier = randomHexBits(253);
        const trapdoor = randomHexBits(253);
        const note = poseidon(nullifier, trapdoor);

        const result = await this.contract.deposit(note, {
            value: toBN(this.denomination).mul(toBN(units)),
            from: account,
        });

        return {
            address: this.contract.address,
            nullifier: nullifier,
            trapdoor: trapdoor,
            index: result.logs[0].args[1].toString(),
            units: units,
            denomination: this.denomination,
        };
    }

    async generateWithdrawalRequest(privNote, recipent, relayer, fee) {
        if (
            privNote.address.toLowerCase() !=
            this.contract.address.toLowerCase()
        ) {
            throw new Error("Mixer address mismatch");
        }

        const unspentUnits = await this.getUnspentUnits(privNote);
        if (unspentUnits.length == 0) {
            throw new Error("All units have been already withdrawn");
        }

        const merklePath = await this.contract.getMerklePath(privNote.index);
        const ctx = await this.contract.getContextHash(recipent, relayer, fee);

        const inputData = {
            nullifier: privNote.nullifier,
            trapdoor: privNote.trapdoor,
            units: privNote.units,
            merklePos: privNote.index,
            merklePath: merklePath,
            currentUnit: unspentUnits[0].toString(),
            context: ctx,
        };

        const { proof, publicSignals } = await groth16.fullProve(
            inputData,
            "circuits/Membership.wasm",
            "circuits/Membership.zkey"
        );

        return {
            address: this.contract.address,
            recipent: recipent,
            relayer: relayer,
            relayerFee: fee,
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
    }

    async withdraw(account, request) {
        if (
            request.address.toLowerCase() != this.contract.address.toLowerCase()
        ) {
            throw new Error("Mixer address mismatch");
        }
        if (account.toLowerCase() != request.relayer.toLowerCase()) {
            throw new Error("Relayer address mismatch");
        }
        await this.contract.withdraw(request, { from: account });
    }

    async getUnspentUnits(privNote) {
        const unspent = [];
        for (let i = 0; i < privNote.units; i++) {
            const note = poseidon(privNote.index, i, privNote.nullifier);
            const used = await this.contract.withdrawn(note);
            if (!used) {
                unspent.push(i);
            }
        }
        return unspent;
    }

    async stats() {
        return {
            maxSlots: (await this.contract.maxSlots()).toString(),
            usedSlots: (await this.contract.usedSlots()).toString(),
            currentUnits: (await this.contract.currentUnits()).toString(),
            anonymitySet: (await this.contract.anonymitySet()).toString(),
        };
    }
}

export async function connectHub(web3, address) {
    const hub = new MixerHub();
    await hub.connect(web3, address);
    return hub;
}

export async function connectMixer(web3, address) {
    const mixer = new Mixer();
    await mixer.connect(web3, address);
    return mixer;
}
