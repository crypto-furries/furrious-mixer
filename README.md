# Furrious Mixer

zk-SNARK based mixer for Ethereum.

## Prerequisites

1. [node.js](https://nodejs.org/) - only `v15` has been tested, but any `v12+` version should work
2. [Ganache](https://www.trufflesuite.com/ganache) for running personal test blockchain
3. [Metamask](https://metamask.io/) for connecting to blockchain through browser

## Building and running

<img src="assets/logo.png" width="200" align="right">

1. Setup Ganache and Metamask.
2. Clone the repository
3. Install dependencies: `npm install`
4. Precompute powers of tau for zk-SNARK: `npm run ptau`
5. Compile circuit, contracts and js: `npm run build`
6. Deploy contracts to Ganache: `npm run deploy`
7. Start dev server: `npm run serve`
8. Visit `localhost:8080` in your browser and enjoy furry mixing
