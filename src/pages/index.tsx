import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";

import styles from "@/styles/Home.module.css";
import { AppProvider } from "@/context/AppContext";
import { Slider, RegionDropdownList } from "@/components/common";
import MobileDrawer from "@/components/common/MobileDrawer";
import { BidBox, SellBox, CombinedOrdersBox, TradeHistoryBox, ClaimBox, EnergyDashboard } from "@/components/market";
import { NFTBox } from "@/components/nft";

export default function Home() {
  const [selected, setSelected] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

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

      <AppProvider>
        <div className="min-h-screen">
          {/* Header */}
          <header className={styles.header}>
            {/* Left: Logo + Region */}
            <div className="flex items-center gap-3 md:gap-5">
              <Link href="/" className={styles.logo}>
                <Image
                  src="/communitas.png"
                  alt="COMMUNITAS"
                  height={32}
                  width={180}
                  className="w-[120px] sm:w-[140px] md:w-[160px]"
                  priority
                />
              </Link>

              <div className="hidden md:flex items-center">
                <div className="w-px h-5 bg-white/[0.08] mr-4" />
                <RegionDropdownList />
              </div>
            </div>

            {/* Center: Desktop tabs (Slider handles flex-1 + centering + md visibility) */}
            <Slider selected={selected} setSelected={setSelected} />

            {/* Right: Bridge + Wallet + Hamburger */}
            <div className="flex items-center gap-2.5">
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
                className="md:hidden p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </header>

          {/* Mobile Drawer */}
          <MobileDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            selected={selected}
            setSelected={setSelected}
          />

          {/* Main Content */}
          <main className="pt-20 md:pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={selected}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex justify-center"
                >
                  {selected === 1 && <BidBox />}
                  {selected === 2 && <SellBox />}
                  {selected === 3 && <CombinedOrdersBox />}
                  {selected === 4 && <TradeHistoryBox />}
                  {selected === 5 && <ClaimBox />}
                  {selected === 6 && <NFTBox />}
                  {selected === 7 && <EnergyDashboard />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </AppProvider>
    </>
  );
}
