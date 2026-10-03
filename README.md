# WattSwap

Frontend for the COMMUNITAS energy market, deployed at https://wattswap.vercel.app.

Buyers place bids and sellers place asks for hourly delivery slots on an
`EnergyBiddingMarket` contract per region (Portugal, Spain, Italy, Denmark). The
contracts run on Nova Cidade, an Arbitrum Orbit chain that settles to Arbitrum Sepolia.
The app also bridges ETH between the two chains, shows a small NFT collection and serves
a password-protected testnet faucet at `/faucet`.

## Stack

Next.js 16 (Pages Router), React 19, wagmi 2 with Reown AppKit, viem 2, `@arbitrum/sdk`
with ethers 5 for the bridge, Tailwind CSS 4.

## Development

Node.js 24 and npm.

```bash
npm install
cp .env.example .env   # fill in NEXT_PUBLIC_PROJECT_ID at least
npm run dev            # http://localhost:3000
npm run build          # next build --webpack
npm run lint
```

`.env.example` lists every variable. Only `NEXT_PUBLIC_*` variables reach the browser.

Contract addresses live in `constants/addresses.json`, Nova Cidade chain and bridge
contracts in `constants/outputInfo.json`, ABIs in `abi/`.
