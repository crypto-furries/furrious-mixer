# Furrious Mixer

zk-SNARK based mixer for Ethereum.

## Building and running

1. Install and setup Ganache and Metamask.
2. Clone the repository
3. Install dependencies: `npm install`
4. Precompute powers of tau for zk-SNARK: `npm run ptau`
5. Compile circuit, contracts and js: `npm run build`
6. Deploy contracts to Ganache: `npm run deploy`
7. Start dev server: `npm run serve`
8. Visit `localhost:8080` in your browser and enjoy furry mixing
