# WattSwap tutorial videos (Remotion)

Tutorial videos for the WattSwap UI (wallet, buy, sell, orders, claim, NFTs, bridge,
dashboard), written with Remotion. Moved here from the branch
`claude/increase-faucet-payout-fYOfQ`, which was deleted because it had a committed `.env`.

The Remotion packages are not in the app's `package.json`, so the app build stays
unaffected. Install them before use:

```bash
npm i -D remotion@4.0.436 @remotion/cli@4.0.436 @remotion/player@4.0.436 \
  @remotion/studio@4.0.436 @remotion/tailwind-v4@4.0.436 @remotion/transitions@4.0.436

npx remotion studio remotion/index.ts   # preview
npx remotion render remotion/index.ts   # render
npx remotion still remotion/index.ts    # single frame
```

`tsconfig.json` excludes this folder so `next build` does not type-check it.
