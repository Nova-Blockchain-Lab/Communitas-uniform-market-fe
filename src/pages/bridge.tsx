import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowLeftRight, ArrowRight, Clock, Layers } from "lucide-react";

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

export default function Bridge() {
  const [activeTab, setActiveTab] = useState<TabId>("bridge");

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
        <div className="min-h-screen bg-[var(--color-bg-dark)]">
          {/* Background */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-transparent" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px'
              }}
            />
          </div>

          {/* Header — unified with main market page */}
          <header className={styles.header}>
            <div className="flex items-center gap-3 md:gap-5">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm font-medium"
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
              <appkit-network-button />
              <appkit-button />
            </div>
          </header>

          {/* Main Content */}
          <main className="px-4 pb-8" style={{ paddingTop: 'calc(var(--header-height) + 1.5rem)' }}>
            <div className="max-w-lg mx-auto">
              {/* Bridge Diagram Hero */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6 p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl"
              >
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  {/* L1 Chain */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                      <Layers size={22} className="text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-white">Arbitrum</p>
                      <p className="text-[10px] text-gray-500">L1 / Sepolia</p>
                    </div>
                  </div>

                  {/* Animated arrows */}
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      <ArrowRight size={16} className="text-emerald-400" />
                    </motion.div>
                    <div className="text-[10px] text-gray-500 font-medium">Bridge</div>
                    <motion.div
                      animate={{ x: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.75 }}
                    >
                      <ArrowLeft size={16} className="text-emerald-400" />
                    </motion.div>
                  </div>

                  {/* L3 Chain */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                      <Layers size={22} className="text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-white">Nova Cidade</p>
                      <p className="text-[10px] text-gray-500">L3 / Orbit</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
              >
                {/* Tabs */}
                <div className="flex border-b border-white/10">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex-1 flex items-center justify-center gap-2 px-4 py-4
                        text-sm font-medium transition-all relative
                        ${activeTab === tab.id
                          ? "text-emerald-400"
                          : "text-gray-500 hover:text-gray-300"
                        }
                      `}
                    >
                      {tab.icon}
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="bridgeActiveTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="p-5">
                  {activeTab === "bridge" ? <BridgeBox /> : <BridgeHistory />}
                </div>
              </motion.div>

              {/* Footer */}
              <div className="mt-6 text-center">
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
