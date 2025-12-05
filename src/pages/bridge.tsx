import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowLeftRight, Clock } from "lucide-react";

import { AppProvider } from "@/context/AppContext";
import { BridgeBox, BridgeHistory } from "@/components/bridge";

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
        <div className="min-h-screen bg-[#0a0a0f]">
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

          {/* Compact Header */}
          <header className="sticky top-0 z-50 px-4 py-3 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/5">
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={18} />
                </Link>
                <Link href="/" className="flex items-center">
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
                <w3m-network-button />
                <w3m-button />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="px-4 py-8">
            <div className="max-w-lg mx-auto">
              {/* Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
      </AppProvider>
    </>
  );
}
