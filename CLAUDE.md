# WattSwap frontend (Communitas-uniform-market-fe)

Next.js Pages Router app for an on-chain energy bidding market. Buyers post bids and
sellers post asks per hourly delivery slot; the contract clears matched orders. Portugal,
Spain, Italy and Denmark each have their own `EnergyBiddingMarket` contract on Nova Cidade.
The app also bridges ETH from Arbitrum Sepolia (L2) to Nova Cidade (L3) via Arbitrum Orbit,
carries an NFT tab, and serves a `/faucet` route. Deployed at https://wattswap.vercel.app.

## Tech stack

- Next.js 16.3.8 (Pages Router, built with `--webpack`) + React 19.3
- wagmi 2.19 + Reown AppKit 1.8 (formerly Web3Modal), `@wagmi/connectors` pinned to 6.2.0
- viem 2.57. ethers 5.8 (declared directly) is only for `@arbitrum/sdk` 4.1: the bridge,
  the NFT bridge and the read providers in `src/config/providers.ts`
- @tanstack/react-query 5 for every async read that is not a wagmi hook
- Tailwind 4, lucide-react, motion 12, react-day-picker (hour picker on the Buy tab),
  d3 (dashboard bubble chart), date-fns, next/font (Inter, JetBrains Mono, self-hosted)

## Directory map

```
src/
  pages/        _app.tsx (providers, AppKit, fonts, one ErrorBoundary), _document.tsx,
                index.tsx (tabbed UI), bridge.tsx, faucet.tsx, api/faucet.ts
  components/
    market/     BidBox, SellBox, CombinedOrdersBox, ClaimBox, TradeHistoryBox,
                dashboard/ (EnergyDashboard, BubbleVisualization, HourSelector)
    bridge/     BridgeBox, BridgeHistory, MessageHistoryRow, NetworkSelector,
                SubmitButton (switch chain, deposit and withdraw in one component)
    common/     ConnectAndSwitchNetworkButton, DateTimePicker, DateNavigationBar,
                RegionDropdownList, MobileDrawer, Slider, SubPageLayout (bridge/faucet shell)
    ui/         Button, Card, Badge, Skeleton, Spinner, Switch, EmptyState,
                TransactionModal, ErrorBoundary
    nft/        NFTBox, NFTCard, PendingNFTBox, BridgeNFTL1ToL2Button,
                BridgeNFTL2ToL1Button, BridgeNFTL2ToL1ExecuteButton, ViewOnOpenseaButton
  config/       chains.ts, wagmi.ts, constants.ts, providers.ts (ethers read providers and
                the Orbit network registration, module scope)
  context/      AppContext.tsx (selected region's market address only)
  hooks/        useTransactionFeedback (tx modal state, txErrorMessage), useWithdrawal
                (withdrawal status + claim), useEthPrice, useTradeData, useDashboardData,
                useMarketToast
  utils/        executeMessageL2ToL1Helper (bridge history, withdrawal status/execute),
                units, utils (formatBalance, timeLeftLabel), dateHelpers, ethersHelper
                (useEthersSigner), mapOrbitConfigToOrbitChain, blockscoutApi,
                fetchUserCountry
  styles/       globals.css, Home.module.css (header classes)
abi/            EnergyBiddingMarket.json, CommunitasNFT.json, CommunitasNFTL1.json,
                CommunitasNFTL2.json
constants/      addresses.json (per-chain, per-region contract addresses),
                outputInfo.json (Nova Cidade chain meta, confirmPeriodBlocks, Orbit
                core/token-bridge contracts)
```

There are no barrel `index.ts` files: import each module by its path.

`TAB_COMPONENTS` in `src/pages/index.tsx`: 1 Buy, 2 Sell, 3 Orders, 4 Trades, 5 Claim,
6 NFTs, 7 Dashboard. Only the active tab renders, inside its own ErrorBoundary.

## Commands

Package manager is npm (`package-lock.json`; there is no pnpm lockfile). Node.js 24.x,
pinned in `package.json` `engines`: Vercel stopped building with Node 20, and `engines`
overrides the project setting on both Vercel projects (`communitas-bidding-market` serves
wattswap.vercel.app, `communitas-uniform-market-fe` is a second deploy of the same repo).
wattswap.novaims.unl.pt 301-redirects to wattswap.vercel.app (nginx on the urbanlab server).

```bash
npm install
npm run dev                # next dev, localhost:3000
npm run build              # next build --webpack
npm run start
npm run lint               # eslint .
```

No local Node 24 on the dev Mac: run the toolchain as
`npx -y -p node@24 node node_modules/next/dist/bin/next build --webpack` (same for
`node_modules/typescript/bin/tsc --noEmit`).

### Dependencies

- `overrides` in `package.json`: `@wagmi/connectors` follows the direct 6.2.0 pin (without
  it `npm audit fix` nests 8.2.0 from the wagmi v3 line under the AppKit adapter and the
  build breaks; `npm ls @wagmi/connectors` must show only 6.2.0), and `ws` 7 and 8 are
  forced to patched versions.
- Never run `npm audit fix --force` (it installs wagmi 3). Stay on wagmi 2, ESLint 9,
  TypeScript 5, motion 12. Next: 16.3.6 is the lowest safe version, avoid 16.3.3 to
  16.3.5 (pinned `^16.3.8`).
- `npm audit --omit=dev` on 2026-10-03: 0 critical, 0 high, 22 moderate, 15 low. The
  moderates are the wagmi 2 / WalletConnect / MetaMask SDK chain (fix only in wagmi 3), the
  lows are ethers 5 / elliptic. The 5 dev-only highs come through eslint-config-next.
- npm 11 asks to approve install scripts (bufferutil, keccak, utf-8-validate,
  unrs-resolver, @reown/appkit); each has a JS fallback and the build passes without them.

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
`api/faucet.ts` imports `novaCidadeMainnet` from `src/config/chains.ts` rather than
redefining it.

The keyed URL is deliberately kept out of the chain definition. AppKit's `switchNetwork`
and wagmi's injected connector pass `chain.rpcUrls.default.http[0]` to the wallet in
`wallet_addEthereumChain`, and a domain-restricted key fails from a wallet (no matching
`Origin`). So the key lives only in the wagmi transport and the providers in
`src/config/providers.ts`.

### Which RPC each surface uses

| Surface | Path | Endpoint |
|---|---|---|
| Reads on Nova Cidade (market, NFT tab `useReadContract`) | wagmi transport | `https://testnet.novaims.unl.pt/` |
| Reads on Arbitrum Sepolia | wagmi transport | `fallback([keyed, public arb RPC])`, AppKit appends Reown's RPC |
| Bridge and NFT bridge `l1Provider` | `src/config/providers.ts` ethers | `ARBITRUM_SEPOLIA_RPC` (keyed, else public), no failover |
| Bridge and NFT bridge `l2Provider` | `src/config/providers.ts` ethers | `https://testnet.novaims.unl.pt/` |
| Bridge gas reads (base fee, deposit `estimateGas`) | `gasOverrides` in `SubmitButton` | `l1Provider` for deposits, `l2Provider` for withdrawals, never the wallet |
| Orbit SDK registration | `providers.ts` at module load | none: `confirmPeriodBlocks` (150, read once from the rollup) lives in `outputInfo.json` |
| Market trade history (Trades tab, dashboard) | `useTradeData` viem client | Blockscout API, falls back to `https://testnet.novaims.unl.pt/` |
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

Fix: both reads now go through `l1Provider` (`src/config/providers.ts`, the keyed Alchemy
endpoint), and the estimated `gasLimit` is passed in `overrides` so ethers has no reason to
ask the wallet. MetaMask is left with `eth_chainId` and the
`eth_sendTransaction` itself. This is mitigation, not a cure: MetaMask still broadcasts
through its own RPC and polls on it in the background, so a user whose MetaMask is badly
throttled should point that network at a keyed RPC in wallet settings.

Since Oct 2026 the withdrawal path reads its base fee from `l2Provider` too: deposit and
withdrawal share `gasOverrides()` in `src/components/bridge/SubmitButton.tsx`.

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
- Remaining single points of failure: the Nova Cidade node itself, and the
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
  `src/config/constants.ts`; the conversion helpers live in `src/utils/units.ts`. Always
  send amounts through `kWhToWatts()`, which rounds to a whole-Watt bigint (0.5 kWh is
  500n; a raw `kWh * 1000` can be 1100.0000000000002 and `BigInt()` throws on it).
- `AppProvider` is mounted once in `_app.tsx` and holds only `energyMarketAddress`, so the
  chosen region survives navigation. `RegionDropdownList` picks the geo-detected country
  (`utils/fetchUserCountry.ts`, else the first region) only while no valid region is set.
- ETH price: `useEthPrice()` (react-query, CoinGecko, 5 min). Only components that show EUR
  call it, so `/faucet` makes no CoinGecko or Arbitrum request.
- Transactions: `useTransactionFeedback()` owns the status, hash, error and modal state.
  `tx.send(() => tx.writeContractAsync({...}))` for one wagmi write (waits for the receipt,
  a revert throws), `tx.run(async (update) => {...})` for multi-step ethers flows. Errors go
  through `txErrorMessage()` (viem `shortMessage`, ethers `reason`, wallet rejection).
  Spread the state into `<TransactionModal>`; inline-feedback boxes (Buy, Claim) read
  `tx.isOpen && tx.status === "error"`.
- Withdrawals (ETH history rows and pending NFTs) share `useWithdrawal(hash)`: status polled
  every minute through react-query (keyed by hash, so one poll per withdrawal), the expected
  claim time, and `claim()`.
- `TransactionStatus` phases: `idle | pending | confirming | bridging | success | error`
  (`src/components/ui/TransactionModal.tsx`). The modal links to the explorer of the chain
  the wallet is on (`useAccount().chain`).
- The wagmi default chain is Nova Cidade, so the wallet auto-switches there after
  `Connect Wallet`. `/bridge` switches back to Arbitrum Sepolia for the deposit step.
- Both bridge directions pass explicit gas overrides (`maxFeePerGas = baseFee * 5`,
  `maxPriorityFeePerGas = 0`, the Arbitrum sequencer ignores tips) from `gasOverrides()` in
  `SubmitButton.tsx`. Do not remove them, see the 2026-05-20 bug below.
- Region and bridge network pickers are transparent native `<select>`s over a styled pill;
  the date bar opens the browser's date picker (`input.showPicker()`).
- Lint: `npm run lint` reports one warning (BubbleVisualization uses `this` in a d3
  callback, so the React Compiler skips it). Keep it at zero errors.

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
   was changed again to read off `l1Provider` instead, for the rate-limiting reason above,
   and in Oct 2026 the withdrawal path moved to `l2Provider` (both now in `SubmitButton.tsx`).

2. **Hydration mismatch on every page load, React error #418 (MEDIUM, fixed).**
   `src/components/common/DateTimePicker.tsx` initialised state with `getNextHour(1)`, which
   calls `new Date()`, so SSR and CSR markup differed and React aborted hydration. Fixed with a
   `mounted` flag: before mount the component returns a fixed-height placeholder `<div>`
   (`minHeight: 480`) and the real picker swaps in on the client. Since Oct 2026 the flag
   comes from `useSyncExternalStore` (server snapshot `false`) instead of a `useEffect`.

3. **Two `<svg>` width/height "Unexpected end of attribute" console warnings (LOW, open).**
   An SVG renders with empty `width=""` / `height=""` during initial load. No local component
   passes an empty string; every `<Image>` and `<svg>` callsite supplies a literal number or a
   defaulted prop. Likely a third party (react-day-picker's nav icon, or Reown AppKit's
   `<w3m-modal>` shadow DOM) before its own data resolves. Cosmetic.

## Bugs fixed 2026-10-03 (audit follow-up)

Verified with a production build and a headless Playwright run that injects a mock EIP-1193
wallet: reads are proxied to the real chains, every `eth_sendTransaction` is rejected and
its calldata recorded.

1. **Every bridge deposit looked deposited.** `getDepositMessageState` called
   `getEthDeposits(l1Provider)` where the SDK expects the child provider, so the deposit
   status was looked up on the wrong chain and always came back `PENDING` (1), and
   `DEPOSIT_STATUS` was an array indexed from 0 while `EthDepositMessageStatus` starts at 1,
   so 1 mapped to "Deposited". Both fixed together: status read on `l2Provider`, and the
   status maps are records keyed by the SDK enums. Checked on Arbitrum Sepolia deposits
   `0xbf56bca3…` and `0xcbcba26b…`: old code returned 1, new code 2 (`DEPOSITED`).
2. **Sell tab dropped fractional kWh.** `parseInt` turned 0.5 into 0. Now `parseFloat`, and
   `placeAsk` gets `kWhToWatts(energy)` (0.5 kWh sends 500). The Buy tab had the same root
   problem in another form: `BigInt(1.1 * 1000)` threw, so 1.1 kWh bids silently failed.
3. **"Cancel Active" cancelled only the first active bid.** The contract has no batch
   cancel, so it now sends one `cancelBid` per active (uncleared, unsettled) bid, waits for
   each receipt, and shows "Canceling 2/5" progress.
4. **`MessageHistoryRow` mutated its `message` prop** when polling. Status now comes from
   `useWithdrawal`.
5. **`NFTCard` mounted every action button twice** (desktop overlay and mobile row), so the
   execute button polled the RPC twice. One action block now serves both layouts.
6. **Bridge history was empty on the public Arbitrum RPC.** The deposit `eth_getLogs` window
   was 10,368,000 blocks; the public RPC rejects ranges over 10,000,000, and the failure
   blanked withdrawals too. Window is now 9,000,000 blocks (about 26 days) and either half
   can fail without hiding the other.
7. **Withdrawal timing showed nonsense.** The progress bar measured against a 7-day period
   while the deadline is `CONFIRMATION_BUFFER_MINUTES` (70) after the withdrawal, and the
   "remaining" label passed a duration to a timestamp formatter ("56 years"). Both use the
   70-minute window now, and the bar shows only while the withdrawal is pending.
8. **Transaction modal linked every hash to Arbiscan**, including Nova Cidade transactions.
9. **The region reset to the geo-detected country** whenever `RegionDropdownList` remounted.
10. The Orders filter row used an undefined `no-scrollbar` class (now `scrollbar-none`).

11. **Withdrawal texts said ~7 days** (BridgeBox, SubmitButton, TransactionModal); this chain's
    claim window is about 70 minutes (`CONFIRMATION_BUFFER_MINUTES`), so they now say about an hour.

Open: the test wallet `0x7502…1081` has two claimable withdrawals (26 and 30 Aug 2026,
0.0101 ETH total).

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
