import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "@/styles/Home.module.css";

const GRID_BG: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
  `,
  backgroundSize: "60px 60px",
};

interface SubPageLayoutProps {
  /** Tailwind gradient start for the top glow, e.g. "from-emerald-950/30" */
  glow: string;
  /** Extra links before the wallet buttons */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}

/** Background, header and centred column shared by /bridge and /faucet. */
export default function SubPageLayout({ glow, headerExtra, children }: SubPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] overflow-x-hidden">
      <div className="fixed inset-0 -z-10">
        <div className={`absolute inset-0 bg-gradient-to-b ${glow} via-transparent to-transparent`} />
        <div className="absolute inset-0" style={GRID_BG} />
      </div>

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
            <Image src="/Logo-NovaCidade.svg" alt="Nova Cidade" height={24} width={100} priority />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {headerExtra}
          <appkit-network-button />
          <appkit-button />
        </div>
      </header>

      <main className="px-3 sm:px-4 pb-8" style={{ paddingTop: "calc(var(--header-height) + 1.5rem)" }}>
        <div className="w-full max-w-lg mx-auto">{children}</div>
      </main>
    </div>
  );
}
