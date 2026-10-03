import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Droplets, Menu } from "lucide-react";

import styles from "@/styles/Home.module.css";
import Slider from "@/components/common/Slider";
import RegionDropdownList from "@/components/common/RegionDropdownList";
import MobileDrawer from "@/components/common/MobileDrawer";
import BidBox from "@/components/market/BidBox";
import SellBox from "@/components/market/SellBox";
import CombinedOrdersBox from "@/components/market/CombinedOrdersBox";
import TradeHistoryBox from "@/components/market/TradeHistoryBox";
import ClaimBox from "@/components/market/ClaimBox";
import EnergyDashboard from "@/components/market/dashboard/EnergyDashboard";
import NFTBox from "@/components/nft/NFTBox";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

const PAGE_TRANSITION = { duration: 0.25, ease: "easeOut" } as const;

const MAIN_STYLE = { paddingTop: "calc(var(--header-height) + 1.5rem)" } as const;

/** Map of tab id to its component. Only the active tab is rendered. */
const TAB_COMPONENTS: Record<number, React.FC> = {
  1: BidBox,
  2: SellBox,
  3: CombinedOrdersBox,
  4: TradeHistoryBox,
  5: ClaimBox,
  6: NFTBox,
  7: EnergyDashboard,
};

export default function Home() {
  const [selected, setSelected] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const ActiveTabComponent = TAB_COMPONENTS[selected];

  return (
    <>
      <Head>
        <title>COMMUNITAS Energy Market</title>
        <meta
          name="description"
          content="Trade energy on the blockchain. Buy, sell, and manage your energy assets."
        />
        <link rel="icon" href="/communitas.ico" />
      </Head>

      <div className="min-h-screen">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className={styles.header}>
          {/* Left: Logo + Region */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5 min-w-0">
            <Link href="/" className={styles.logo}>
              <Image
                src="/communitas.png"
                alt="COMMUNITAS"
                height={32}
                width={180}
                className="w-[100px] xs:w-[120px] sm:w-[140px] md:w-[160px] shrink-0"
                priority
              />
            </Link>

            <div className="hidden md:flex items-center">
              <div className="w-px h-5 bg-white/[0.08] mr-4" />
              <RegionDropdownList />
            </div>
          </div>

          {/* Center: Desktop tabs */}
          <Slider selected={selected} setSelected={setSelected} />

          {/* Right: Bridge + Wallet + Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Bridge Link (lg+ desktop) */}
            <Link
              href="/bridge"
              className="
                hidden lg:flex items-center gap-1.5
                px-3 py-2
                text-emerald-400/80 text-xs font-medium tracking-wide
                rounded-lg
                hover:text-emerald-300 hover:bg-emerald-500/10
                transition-all duration-200
              "
            >
              Bridge
              <ArrowRight size={14} />
            </Link>

            {/* Faucet Link (lg+ desktop) */}
            <Link
              href="/faucet"
              className="
                hidden lg:flex items-center gap-1.5
                px-3 py-2
                text-cyan-400/80 text-xs font-medium tracking-wide
                rounded-lg
                hover:text-cyan-300 hover:bg-cyan-500/10
                transition-all duration-200
              "
            >
              <Droplets size={13} />
              Faucet
            </Link>

            {/* Wallet Buttons */}
            <div className={styles.buttons}>
              <div className={`${styles.highlight} hidden md:block`}>
                <w3m-network-button />
              </div>
              <div className={styles.highlight}>
                <appkit-button />
              </div>
            </div>

            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* ── Mobile Drawer ──────────────────────────────────── */}
        <MobileDrawer
          isOpen={drawerOpen}
          onClose={closeDrawer}
          selected={selected}
          setSelected={setSelected}
        />

        {/* ── Main Content ───────────────────────────────────── */}
        <main
          className="pb-8 sm:pb-12 px-2 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden"
          style={MAIN_STYLE}
        >
          <div className="w-full max-w-7xl mx-auto">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={selected}
                variants={PAGE_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={PAGE_TRANSITION}
                className="flex justify-center w-full"
              >
                {/* Per-tab boundary: a crashing tab leaves the header usable */}
                <ErrorBoundary key={selected}>
                  {ActiveTabComponent && <ActiveTabComponent />}
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  );
}
