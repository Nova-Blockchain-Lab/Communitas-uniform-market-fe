/** Remotion timing constants and helpers */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Convert seconds to frames */
export const sec = (s: number) => Math.round(s * FPS);

/** Standard durations in frames */
export const DURATIONS = {
  intro: sec(3),         // 90 frames
  chapterCard: sec(2),   // 60 frames
  outro: sec(4),         // 120 frames
  transition: 15,        // 0.5s
  fadeIn: sec(0.5),      // 15 frames
  fadeOut: sec(0.5),     // 15 frames
  cursorMove: sec(0.8),  // 24 frames
  clickEffect: sec(0.3), // 9 frames
  typeChar: 3,           // 3 frames per character
  annotation: sec(2),    // 60 frames
  pause: sec(1),         // 30 frames
} as const;

/** Scene durations in frames */
export const SCENE_DURATIONS = {
  connectWallet: sec(10),
  bridgeFunds: sec(35),
  bidOnEnergy: sec(40),
  sellEnergy: sec(25),
  checkBuyerOrders: sec(20),
  checkSellerOrders: sec(20),
  claimBuyerRefund: sec(25),
  claimSellerEarnings: sec(25),
  cancelBid: sec(25),
  mintNFT: sec(15),
  bridgeNFT: sec(15),
  gallery: sec(10),
  dashboard: sec(20),
} as const;
