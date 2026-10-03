# WattSwap frontend (Communitas-uniform-market-fe)

Next.js Pages Router app for an on-chain energy bidding market. Buyers post bids and
sellers post asks per hourly delivery slot; the contract clears matched orders. Portugal,
Spain, Italy and Denmark each have their own `EnergyBiddingMarket` contract on Nova Cidade.
The app also bridges ETH from Arbitrum Sepolia (L2) to Nova Cidade (L3) via Arbitrum Orbit,
carries an NFT tab, and serves a `/faucet` route. Deployed at https://wattswap.vercel.app.

## Tech stack

- Next.js 16 (Pages Router) + React 19
- wagmi v2 + Reown AppKit (formerly Web3Modal)
- viem 2.x. ethers v5 arrives indirectly through `@arbitrum/sdk` and is used for the bridge
  and for `AppContext`'s providers
- Tailwind 4, lucide-react, motion, react-day-picker, d3 (dashboard)

## Directory map

```
src/
  pages/        index.tsx (tabbed UI), bridge.tsx, faucet.tsx, api/faucet.ts
  components/
    market/     BidBox, SellBox, CombinedOrdersBox, ClaimBox, TradeHistoryBox, dashboard/
    bridge/     BridgeBox, BridgeHistory, NetworkSelector, SubmitDepositButton,
                SubmitWithdrawalButton, AmountInput, MessageHistoryRow, NavigationTabs
    common/     ConnectAndSwitchNetworkButton, DateTimePicker, DateNavigationBar,
                RegionDropdownList, MobileDrawer, Slider
    ui/         Button, Card, Input, Badge, Skeleton, Spinner, Switch, EmptyState,
                TransactionModal, ErrorBoundary
    nft/        NFTBox, NFTCard, PendingNFTBox, BridgeNFTL1ToL2Button,
                BridgeNFTL2ToL1Button, BridgeNFTL2ToL1ExecuteButton
  config/       chains.ts, wagmi.ts, constants.ts (re-exported from index.ts)
  context/      AppContext.tsx (region market address, l1/l2 providers, eth price)
  hooks/        useTradeData, useDashboardData, useMarketToast, useTransactionFeedback
  utils/        dateHelpers, units, utils (formatBalance, getProviderForChainId),
                fetchUserCountry, ethersHelper, mapOrbitConfigToOrbitChain,
                blockscoutApi, executeMessageL2ToL1Helper
  types/        index.ts
  styles/
abi/            EnergyBiddingMarket.json, CommunitasNFT.json, CommunitasNFTL1.json,
                CommunitasNFTL2.json
constants/      addresses.json (per-chain, per-region contract addresses),
                outputInfo.json (Nova Cidade chain meta + Orbit core/token-bridge
                contracts), config.ts
```

`TAB_COMPONENTS` in `src/pages/index.tsx`: 1 Buy, 2 Sell, 3 Orders, 4 Trades, 5 Claim,
6 NFTs, 7 Dashboard. Only the active tab renders.

## Commands

Package manager is npm (`package-lock.json`; there is no pnpm lockfile).

```bash
npm install
npm run dev                # next dev, localhost:3000
npm run build              # next build --webpack
npm run start
npm run lint               # eslint .
```

## Chains

- **Nova Cidade (default)**: chainId `93735000855` / `0x15d30a9b17`, RPC
  `https://testnet.novaims.unl.pt/`, explorer `https://testnet.explorer.novaims.unl.pt/`.
  Defined in `src/config/chains.ts` from `constants/outputInfo.json`. Hosts every
  `EnergyBiddingMarket` contract.
- **Arbitrum Sepolia (parent)**: chainId `421614`. Origin chain for the deposit flow.
  `baseChain` is viem's stock `arbitrumSepolia` (its `rpcUrls.default` is the public RPC).

All browser-side Arbitrum Sepolia RPC use goes through `ARBITRUM_SEPOLIA_RPC` /
`arbitrumSepoliaRpcUrls` in `src/config/chains.ts`, which read
`NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL` and fall back to the public
`https://sepolia-rollup.arbitrum.io/rpc` when it is unset. Do not read `process.env` for an
RPC anywhere else in client code. Next.js only inlines `NEXT_PUBLIC_*` into the client
bundle, so a plain `process.env.FOO` in client code is `undefined` at runtime.

The keyed URL is deliberately kept out of the chain definition. AppKit's `switchNetwork`
and wagmi's injected connector pass `chain.rpcUrls.default.http[0]` to the wallet in
`wallet_addEthereumChain`, and a domain-restricted key fails from a wallet (no matching
`Origin`). So the key lives only in the wagmi transport and `AppContext`'s providers.

### Which RPC each surface uses

| Surface | Path | Endpoint |
|---|---|---|
| Reads on Nova Cidade (market, NFT tab `useReadContract`) | wagmi transport | `https://testnet.novaims.unl.pt/` |
| Reads on Arbitrum Sepolia | wagmi transport | `fallback([keyed, public arb RPC])`, AppKit appends Reown's RPC |
| Bridge and NFT bridge `l1Provider` | `AppContext` ethers | `ARBITRUM_SEPOLIA_RPC` (keyed, else public), no failover |
| Bridge and NFT bridge `l2Provider` | `AppContext` ethers | `https://testnet.novaims.unl.pt/` |
| Orbit SDK registration | `mapOrbitConfigToOrbitChain` | `ARBITRUM_SEPOLIA_RPC`, defaults `confirmPeriodBlocks` to 150 on failure |
| Market trade history | `useTradeData`, `TradeHistoryBox` viem clients | `https://testnet.novaims.unl.pt/` |
| Faucet API (server) | `api/faucet.ts` | `ARBITRUM_SEPOLIA_RPC_URL` (server-only), else public; Nova via `testnet.novaims.unl.pt` |
| Sending a transaction | the user's wallet | MetaMask's own RPC, not the app's |

### Bridge deposit failed with `-32005 Request is being rate limited` (Aug 2026)

MetaMask never opened. The error surfaced from `SubmitDepositButton`'s catch with
`httpStatus: 429` and a stack entirely inside the extension. The deposit's reads were going
through the wallet, not the app: ethers routes `estimateGas` through `signer.provider`
(`node_modules/@ethersproject/providers/lib/json-rpc-provider.js:266`), and the button's
`getBlock("latest")` used the same provider. `signer` comes from `useEthersSigner`, which
wraps the wagmi transport in a `Web3Provider`, so both landed on MetaMask's built-in
Arbitrum Sepolia endpoint, which is shared across all MetaMask users and throttles.

Fix: both reads now go through `AppContext`'s `l1Provider` (the keyed Alchemy endpoint) via
a local `readProvider`, and the estimated `gasLimit` is passed in `overrides` so ethers has
no reason to ask the wallet. MetaMask is left with `eth_chainId` and the
`eth_sendTransaction` itself. This is mitigation, not a cure: MetaMask still broadcasts
through its own RPC and polls on it in the background, so a user whose MetaMask is badly
throttled should point that network at a keyed RPC in wallet settings.

`SubmitWithdrawalButton.tsx:47` still has the `signer.provider!.getBlock("latest")` pattern,
but a withdrawal signs on Nova Cidade, where MetaMask uses our own node rather than a shared
public endpoint. Left as-is.

Notes:
- The browser key is public by design (it ships in the client bundle). Restrict it by domain
  allowlist in the Alchemy dashboard (`wattswap.vercel.app`, `wattswap.novaims.unl.pt`)
  rather than trying to hide it, and never share it with a server: Alchemy rejects requests
  without a matching `Origin` header once a domain allowlist is set, and a shared key lets
  the public bundle exhaust the server's quota. The nitro node and Blockscout's
  `INDEXER_ARBITRUM_L1_RPC` need their own keys.
- `testnet.novaims.unl.pt` and `wattswap.novaims.unl.pt` are split-horizon: `10.10.2.57` on
  campus, `193.136.119.39` publicly. Both are the same box, so there is no second Nova Cidade
  endpoint to fall back to. `wagmi.ts` therefore uses a bare `http()` transport for Nova
  Cidade and a `fallback()` only for Arbitrum Sepolia.
- Remaining single points of failure: the Nova Cidade node itself, and `AppContext`'s
  `l1Provider` (a plain `StaticJsonRpcProvider`, no failover). Add a `FallbackProvider` there
  if Alchemy outages start affecting the NFT bridge.

## Environment variables

`.env` locally, Vercel project settings in production (see `.env.example`):

| Variable | Side | Holds |
|---|---|---|
| `NEXT_PUBLIC_PROJECT_ID` | browser | Reown project ID (public, restrict domains in Reown) |
| `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL` | browser | Arbitrum Sepolia RPC with a domain-restricted key. Optional, unset uses the public RPC |
| `ARBITRUM_SEPOLIA_RPC_URL` | server | Arbitrum Sepolia RPC for `/api/faucet`, a key without a domain allowlist. Optional |
| `FAUCET_PASSWORD` | server | `/faucet` password |
| `FAUCET_PRIVATE_KEY` | server | faucet wallet key (also the batch poster) |

Server-side vars must never carry the `NEXT_PUBLIC_` prefix. `NEXT_PUBLIC_INFURA_RPC` and
`SKIP_PREFLIGHT_CHECK` are no longer read; delete them from Vercel and `.env`.

Key exposure (Oct 2026): the old Alchemy key (`4Thn...`) was served in the client bundle via
`NEXT_PUBLIC_INFURA_RPC` and was also committed in `.env` in `5336860` (on the public remote
branch `claude/increase-faucet-payout-fYOfQ`). An Infura key (`cf29...`) was hardcoded in
`AppContext` in Jan 2025 (`ac0e484`, removed in `d166205`, both in `main`). Treat both as
burned. Older remote branches still track a `.env` holding only `NEXT_PUBLIC_PROJECT_ID`.

## Faucet (`/faucet`)

- Page `src/pages/faucet.tsx`, API `src/pages/api/faucet.ts`.
- Each request sends two transactions from the same wallet
  (`0x7502e2fcD1416648e4F2392B8F274C7f1e5b1081`):
  0.01 ETH on Nova Cidade (`FAUCET_AMOUNT_NOVA`), which covers all market tests, and
  0.0015 ETH on Arbitrum Sepolia (`FAUCET_AMOUNT_ARB`), which covers the two bridge-dependent
  tests (TC09.01 deposit and the withdrawal claim). The Arb figure is 0.001 ETH to bridge plus
  roughly 0.0005 ETH of gas headroom across both legs at a ~0.02 gwei base fee.
- The Arb Sepolia send applies `maxFeePerGas = baseFee * 5` and `maxPriorityFeePerGas = 0`,
  the same pattern as the bridge buttons, to avoid the "max fee per gas less than block base
  fee" revert.
- Min-balance guards: `MIN_BALANCE_NOVA = 0.02`, `MIN_BALANCE_ARB = 0.003`.
- The response keeps the legacy `{hash, amount, explorer}` fields (Nova) and adds
  `{novaCidade, arbitrumSepolia}` objects, each `{chain, amount, hash, explorer}`. The success
  view renders one transaction block per chain with copy and explorer links.
- Verified end to end 2026-06-02, both transactions confirmed on-chain (Nova `0x94b768…c4a0`,
  Arb `0x9db393…f09d15`).
- The faucet wallet is also the Nova Cidade **batch poster** (`batchPoster` in
  `constants/outputInfo.json`). Draining it on Arbitrum Sepolia stops the chain posting
  batches to the parent chain. Watch its Sepolia balance.

## Conventions

- The contract works in watts, the UI displays kWh. `WATTS_PER_KWH = 1000` is defined in
  `src/config/constants.ts`; the conversion helpers live in `src/utils/units.ts`.
- `RegionDropdownList` swaps `energyMarketAddress` on `AppContext`. It defaults to the user's
  geo-detected country via `utils/fetchUserCountry.ts`, falling back to the first available
  region.
- The wagmi default chain is Nova Cidade, so the wallet auto-switches there after
  `Connect Wallet`. `/bridge` switches back to Arbitrum Sepolia for the deposit step.
- `TransactionStatus` phases: `idle | pending | confirming | bridging | success | error`
  (`src/components/ui/TransactionModal.tsx`).
- Both bridge buttons pass explicit gas overrides (`maxFeePerGas = baseFee * 5`,
  `maxPriorityFeePerGas = 0`, the Arbitrum sequencer ignores tips). Do not remove them, see
  the 2026-05-20 bug below.

## Test cases

TC09.01 connect wallet and bridge Arbitrum to Nova Cidade; TC09.02 place a bid;
TC09.04 check bid result (Buyer Orders); TC09.06 claim refund (buyer); TC09.08 cancel bid
order; TC09.10 dashboard / hourly energy data.

## Known bugs found 2026-05-20

Found with Playwright + dappwright (MetaMask 13.17.0) against https://wattswap.vercel.app/.

1. **Bridge deposit reverted with "max fee per gas less than block base fee" (HIGH, fixed).**
   `SubmitDepositButton` called `EthBridger.deposit({ amount, parentSigner })` with no gas
   overrides. The ethers v5 default (`maxFeePerGas = baseFee * 2 + maxPriorityFeePerGas`)
   routinely lands below the next block's base fee on Arbitrum Sepolia, whose base fee moves
   within seconds (observed `maxFeePerGas=20002000` against `baseFee=20006000`). The
   transaction was rejected with `code -32603`.

   Fixed in `SubmitDepositButton.tsx` and `SubmitWithdrawalButton.tsx` by reading the latest
   block's `baseFeePerGas`, computing `maxFeePerGas = baseFee * 5` and
   `maxPriorityFeePerGas = 0`, and passing them via `overrides`. Verified on-chain 2026-05-20:
   L1 transaction `0xa1dbd4…5435` on Arb Sepolia, L1 to L2 message landed on Nova Cidade
   (`complete: true`), 0.001 ETH bridged. Not an RPC staleness issue, three independent RPCs
   returned the same base fee.

   The 2026-05 fix read the base fee off the *signer's* provider. In Aug 2026 the deposit path
   was changed again to read off `AppContext`'s `l1Provider` instead, for the rate-limiting
   reason above. The withdrawal path still reads off the signer.

2. **Hydration mismatch on every page load, React error #418 (MEDIUM, fixed).**
   `src/components/common/DateTimePicker.tsx` initialised state with `getNextHour(1)`, which
   calls `new Date()`, so SSR and CSR markup differed and React aborted hydration. Fixed with a
   `mounted` flag: before mount the component returns a fixed-height placeholder `<div>`
   (`minHeight: 480`) and the real picker swaps in on the first client `useEffect` tick. The
   state defaults stay numeric.

3. **Two `<svg>` width/height "Unexpected end of attribute" console warnings (LOW, open).**
   An SVG renders with empty `width=""` / `height=""` during initial load. No local component
   passes an empty string; every `<Image>` and `<svg>` callsite supplies a literal number or a
   defaulted prop. Likely a third party (react-day-picker's nav icon, or Reown AppKit's
   `<w3m-modal>` shadow DOM) before its own data resolves. Cosmetic.

## Verified end to end

Wallet connect through Reown AppKit to MetaMask; auto network switch to Nova Cidade after
connect; manual switch back to Arbitrum Sepolia on `/bridge` (`wallet_addEthereumChain` plus
`wallet_switchEthereumChain`); bridge deposit Arb Sepolia to Nova Cidade with the gas
overrides applied, retryable ticket auto-redeemed and child balance credited; `Place Bid` on
the Buy tab against Portugal, Spain and Denmark; `Cancel Bid` round trip on the Orders tab for
Spain and Denmark. Orders, Trades, Claim, NFTs and Dashboard all render, and the "Wrong
Network" guard forces a switch when the wallet sits on Arbitrum Sepolia.

## Playwright + MetaMask test harness

A persistent MetaMask profile lives at `~/.cache/wattswap-test/`. Reuse it rather than
re-onboarding MetaMask every run: first connect drops from roughly 60 to 90 seconds
(dappwright bootstrap) to about 11 seconds, because Chromium launches with the cached profile
and wagmi auto-reconnects from saved cookies.

```js
import { openMM, driveMM, shadowClick } from '/home/USER/.cache/wattswap-test/mm-launcher.mjs';

const { context, mmExtensionId, close } = await openMM();
const page = await context.newPage();
await page.goto('https://wattswap.vercel.app');     // already connected
await driveMM(context, 'tx-confirm');               // approves any open MM popup
await close();
```

Smoke test: `node ~/.cache/wattswap-test/smoke-launcher.mjs`. Rebuild the cache after a
MetaMask upgrade with `node ~/.cache/wattswap-test/bootstrap-once.mjs`. The cache imports
`FAUCET_PRIVATE_KEY` from this repo's `.env`.

Why the launcher exists, given `@tenkeylabs/dappwright` against MM 13.17:

- `dappwright.bootstrap(...)` only triggers the MetaMask download when
  `process.env.TEST_PARALLEL_INDEX === '0'`. Always export `TEST_PARALLEL_INDEX=0` outside
  `@playwright/test`'s parallel runner, otherwise it sits forever printing "Waiting for primary
  worker to download metamask…".
- Force `DISPLAY=:1` (and `XAUTHORITY=/run/user/<UID>/gdm/Xauthority`) so Playwright launches
  the full `chromium-1223/chrome-linux64/chrome` rather than the headless-shell binary, which
  cannot load extensions.
- Drive the MetaMask popup yourself: enumerate `context.pages()` for a
  `chrome-extension://…/notification.html` page and click `getByTestId('confirm-btn')`,
  `getByTestId('confirm-footer-button')` or
  `getByRole('button', { name: /^(connect|confirm|next|approve)$/i })`.
- `wallet.addNetwork` is flaky in MM 13.17. Skip it and let the dApp drive network registration
  through `wallet_addEthereumChain` prompts approved by the same popup driver.

## Test wallet

`FAUCET_PRIVATE_KEY` in `.env` is the key for `0x7502e2fcD1416648e4F2392B8F274C7f1e5b1081`,
the same wallet the live `/faucet` route drips from and the Nova Cidade batch poster.
Automated tests deplete it, and an empty Sepolia balance stops batch posting. Check its
balance before and after a test run.
