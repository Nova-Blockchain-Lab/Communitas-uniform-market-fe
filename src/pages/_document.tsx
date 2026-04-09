import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon & App Icons */}
        <link rel="icon" href="/communitas.ico" />
        <link rel="apple-touch-icon" href="/communitasicon.png" />

        {/* Theme & Mobile Chrome */}
        <meta name="theme-color" content="#060609" />
        <meta name="color-scheme" content="dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* Font preconnects — before any font CSS loads */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for RPC & explorer used at runtime */}
        <link rel="dns-prefetch" href="https://testnet.novaims.unl.pt" />
        <link rel="dns-prefetch" href="https://testnet.explorer.novaims.unl.pt" />

        {/* SEO */}
        <meta
          name="google-site-verification"
          content="6Gtzx3veON661xdrUMbM-KbCCO2MrRfVAWDu-tlZy84"
        />
        <meta
          name="description"
          content="WattSwap lets users trade energy in real-time using blockchain. Built for transparency and sustainability. Built by the Communitas project."
        />

        {/* Open Graph defaults (pages can override via next/head) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="WattSwap by Communitas" />
        <meta
          property="og:description"
          content="Trade energy in real-time on the blockchain. Transparent, sustainable, community-driven."
        />
        <meta property="og:image" content="/communitas.png" />
      </Head>
      <body className="bg-[#060609] text-white antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
