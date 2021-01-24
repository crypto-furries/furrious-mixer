# Furrious Mixer

zk-SNARK based mixer for Ethereum.

## Building and running

1. Install and setup Ganache and Metamask.
2. Precompute powers of tau for zk-SNARK: `npm run ptau`
3. Compile circuit, contracts and js: `npm run build`
4. Deploy contracts to Ganache: `npm run deploy`
5. Start dev server: `npm run serve`
6. Visit `localhost:8080` in your browser and enjoy furry mixing
