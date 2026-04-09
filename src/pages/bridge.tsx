import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowLeftRight, ArrowRight, Clock, Droplets, Layers } from "lucide-react";

import styles from "@/styles/Home.module.css";
import { AppProvider } from "@/context/AppContext";
import { BridgeBox, BridgeHistory } from "@/components/bridge";
import { ErrorBoundary } from "@/components/ui";

type TabId = "bridge" | "history";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "bridge", label: "Bridge", icon: <ArrowLeftRight size={16} /> },
  { id: "history", label: "History", icon: <Clock size={16} /> },
];

/* ── Pre-defined animation configs (avoids inline object re-creation) ── */

const heroEntrance = { opacity: 0, y: 12 } as const;
const heroAnimate = { opacity: 1, y: 0 } as const;
const heroTransition = { duration: 0.5 } as const;

const cardEntrance = { opacity: 0, y: 20 } as const;
const cardAnimate = { opacity: 1, y: 0 } as const;
const cardTransition = { delay: 0.1 } as const;

const arrowRightAnimate = { x: [0, 4, 0] };
const arrowRightTransition = { repeat: Infinity, duration: 1.5, ease: "easeInOut" } as const;
const arrowLeftAnimate = { x: [0, -4, 0] };
const arrowLeftTransition = { repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.75 } as const;

const tabIndicatorTransition = { type: "spring", bounce: 0.2, duration: 0.6 } as const;

const tabContentVariants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

const tabContentTransition = { duration: 0.2, ease: "easeInOut" } as const;

const gridBgStyle: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
  `,
  backgroundSize: "60px 60px",
};

const mainPaddingStyle: React.CSSProperties = {
  paddingTop: "calc(var(--header-height) + 1.5rem)",
};

export default function Bridge() {
  const [activeTab, setActiveTab] = useState<TabId>("bridge");

  const handleTabChange = useCallback((id: TabId) => {
    setActiveTab(id);
  }, []);

  const tabContent = useMemo(
    () => (activeTab === "bridge" ? <BridgeBox /> : <BridgeHistory />),
    [activeTab],
  );

  return (
    <>
      <Head>
        <title>Nova Cidade Bridge | COMMUNITAS</title>
        <meta
          name="description"
          content="Bridge ETH between Arbitrum and Nova Cidade networks"
        />
        <link rel="icon" href="/Logo-NovaCidade.svg" />
      </Head>

      <AppProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-[var(--color-bg-dark)] overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-transparent" />
              <div className="absolute inset-0" style={gridBgStyle} />
            </div>

            {/* Header — unified with main market page */}
            <header className={styles.header}>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm font-medium min-h-[44px]"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Back to Market</span>
                </Link>

                <div className="w-px h-5 bg-white/[0.08]" />

                <Link href="/" className={styles.logo}>
                  <Image
                    src="/Logo-NovaCidade.svg"
                    alt="Nova Cidade"
                    height={24}
                    width={100}
                    priority
                  />
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/faucet"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium min-h-[44px]"
                >
                  <Droplets size={14} />
                  <span className="hidden sm:inline">Faucet</span>
                </Link>
                <appkit-network-button />
                <appkit-button />
              </div>
            </header>

            {/* Main Content */}
            <main
              className="px-3 sm:px-4 pb-8"
              style={mainPaddingStyle}
            >
              <div className="w-full max-w-lg mx-auto">
                {/* Bridge Diagram Hero */}
                <motion.div
                  initial={heroEntrance}
                  animate={heroAnimate}
                  transition={heroTransition}
                  className="mb-4 sm:mb-6 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-center gap-3 xs:gap-4 sm:gap-6">
                    {/* L1 Chain */}
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                        <Layers size={20} className="text-blue-400 sm:hidden" />
                        <Layers size={22} className="text-blue-400 hidden sm:block" />
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] sm:text-xs font-semibold text-white">Arbitrum</p>
                        <p className="text-[10px] text-gray-500">L1 / Sepolia</p>
                      </div>
                    </div>

                    {/* Animated arrows */}
                    <div className="flex flex-col items-center gap-1">
                      <motion.div
                        animate={arrowRightAnimate}
                        transition={arrowRightTransition}
                      >
                        <ArrowRight size={16} className="text-emerald-400" />
                      </motion.div>
                      <div className="text-[10px] text-gray-500 font-medium">Bridge</div>
                      <motion.div
                        animate={arrowLeftAnimate}
                        transition={arrowLeftTransition}
                      >
                        <ArrowLeft size={16} className="text-emerald-400" />
                      </motion.div>
                    </div>

                    {/* L3 Chain */}
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                        <Layers size={20} className="text-emerald-400 sm:hidden" />
                        <Layers size={22} className="text-emerald-400 hidden sm:block" />
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] sm:text-xs font-semibold text-white">Nova Cidade</p>
                        <p className="text-[10px] text-gray-500">L3 / Orbit</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Card */}
                <motion.div
                  initial={cardEntrance}
                  animate={cardAnimate}
                  transition={cardTransition}
                  className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
                >
                  {/* Tabs */}
                  <div className="flex border-b border-white/10" role="tablist">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          role="tab"
                          aria-selected={isActive}
                          aria-controls={`tabpanel-${tab.id}`}
                          onClick={() => handleTabChange(tab.id)}
                          className={`
                            flex-1 flex items-center justify-center gap-2
                            px-3 sm:px-4 min-h-[44px] py-3
                            text-sm font-medium transition-colors duration-200 relative
                            cursor-pointer select-none
                            ${isActive
                              ? "text-emerald-400"
                              : "text-gray-500 hover:text-gray-300 active:text-gray-200"
                            }
                          `}
                        >
                          {tab.icon}
                          {tab.label}
                          {isActive && (
                            <motion.div
                              layoutId="bridgeActiveTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                              transition={tabIndicatorTransition}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Content */}
                  <div
                    id={`tabpanel-${activeTab}`}
                    role="tabpanel"
                    className="p-3 sm:p-5"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        variants={tabContentVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={tabContentTransition}
                      >
                        {tabContent}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Footer */}
                <div className="mt-4 sm:mt-6 text-center">
                  <p className="text-xs text-gray-600">
                    Bridge ETH between Arbitrum Sepolia and Nova Cidade
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    Powered by Arbitrum Orbit
                  </p>
                </div>
              </div>
            </main>
          </div>
        </ErrorBoundary>
      </AppProvider>
    </>
  );
}
