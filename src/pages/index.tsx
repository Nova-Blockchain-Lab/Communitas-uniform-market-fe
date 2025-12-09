import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

import styles from "@/styles/Home.module.css";
import { AppProvider } from "@/context/AppContext";
import { Slider, RegionDropdownList } from "@/components/common";
import { BidBox, SellBox, CombinedOrdersBox, ClaimBox } from "@/components/market";
import { NFTBox } from "@/components/nft";

export default function Home() {
  const [selected, setSelected] = useState(1);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
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
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link href="/" className={styles.logo}>
                <Image
                  src="/communitas.png"
                  alt="COMMUNITAS"
                  height={32}
                  width={180}
                  priority
                />
              </Link>

              {/* Region Selector */}
              <div className="hidden md:block">
                <RegionDropdownList />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Slider selected={selected} setSelected={setSelected} />

              {/* Bridge Link */}
              <Link
                href="/bridge"
                className="
                  hidden lg:flex items-center gap-2
                  px-4 py-2.5
                  bg-gradient-to-r from-emerald-600 to-emerald-500
                  text-white text-sm font-semibold
                  rounded-xl
                  shadow-lg hover:shadow-xl hover:shadow-emerald-500/25
                  transition-all duration-200
                  hover:from-emerald-500 hover:to-emerald-400
                "
              >
                Bridge
                <ArrowRight size={16} />
              </Link>

              {/* Wallet Buttons */}
              <div className={styles.buttons}>
                <div className={styles.highlight}>
                  <appkit-network-button />
                </div>
                <div className={styles.highlight}>
                  <appkit-button />
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Region Selector */}
          <div className="md:hidden fixed top-20 left-4 z-40">
            <RegionDropdownList />
          </div>

          {/* Main Content */}
          <main className="pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="flex justify-center"
                >
                  {selected === 1 && <BidBox />}
                  {selected === 2 && <SellBox />}
                  {selected === 3 && <CombinedOrdersBox />}
                  {selected === 4 && <ClaimBox />}
                  {selected === 5 && <NFTBox />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Mobile Bridge Link */}
          <div className="lg:hidden fixed bottom-6 right-6 z-40">
            <Link
              href="/bridge"
              className="
                flex items-center justify-center
                w-14 h-14
                bg-gradient-to-r from-emerald-600 to-emerald-500
                text-white
                rounded-full
                shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30
                transition-all duration-200
              "
            >
              <ArrowRight size={24} />
            </Link>
          </div>
        </div>
      </AppProvider>
    </>
  );
}
