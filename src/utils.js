import circomlib from "circomlib";
import TruffleContract from "@truffle/contract";
import { padLeft, randomHex, toBN, toHex } from "web3-utils";

export function toBytes32(val) {
    return padLeft(toHex(val), 64);
}

export function poseidon(...args) {
    return toBytes32(circomlib.poseidon(args).toString());
}

export async function loadContract(web3, address, url) {
    const response = await fetch(url);
    const contract = TruffleContract(await response.json());
    contract.setProvider(web3.currentProvider);
    return await (address ? contract.at(address) : contract.deployed());
}

export function randomHexBits(bits) {
    if (bits % 8 == 0) {
        return randomHex(bits / 8);
    }
    return toHex(toBN(randomHex(Math.ceil(bits / 8))).shrn(8 - (bits % 8)));
}
