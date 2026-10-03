/** Shared TypeScript types for Remotion compositions */

export interface Point {
  x: number;
  y: number;
}

export interface CursorStep {
  /** Target position (0-1 normalized to video dimensions) */
  target: Point;
  /** Frame at which cursor starts moving */
  startFrame: number;
  /** Duration of cursor movement in frames */
  moveDuration: number;
  /** Whether to perform a click at the target */
  click?: boolean;
  /** Optional text to type after clicking */
  typeText?: string;
}

export interface AnnotationConfig {
  /** Text label */
  text: string;
  /** Position on screen */
  position: Point;
  /** Arrow direction pointing to the element */
  arrowDirection?: "up" | "down" | "left" | "right";
  /** Frame when annotation appears */
  startFrame: number;
  /** Duration in frames */
  duration: number;
  /** Variant styling */
  variant?: "info" | "success" | "warning" | "error";
}

export interface SceneProps {
  /** Starting frame offset within the composition */
  startFrom?: number;
}

export type TabName = "Buy" | "Sell" | "Orders" | "History" | "Claim" | "NFTs" | "Dashboard";
