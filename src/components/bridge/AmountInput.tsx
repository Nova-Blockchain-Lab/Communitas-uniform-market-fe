import React, { useCallback, useMemo } from "react";
import { InfoIcon, TokenIcon } from "./IconComponents";
import { useAppContext } from "@/context/AppContext";

interface AmountInputProps {
  label: string;
  amount: string;
  maxAmount?: string;
  showTokenSelector?: boolean;
  tokenName?: string;
  isInput: boolean;
  showInfoIcon?: boolean;
  onChange?: (value: string) => void;
  error?: string;
}

/** Percentage presets for quick amount entry */
const PERCENT_PRESETS = [25, 50, 75, 100] as const;

export const AmountInput: React.FC<AmountInputProps> = ({
  label,
  amount,
  maxAmount,
  showTokenSelector = false,
  tokenName,
  isInput,
  showInfoIcon = false,
  onChange,
  error,
}) => {
  const { ethPrice } = useAppContext();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    },
    [onChange],
  );

  const handlePercentClick = useCallback(
    (percent: number) => {
      if (!maxAmount || !onChange) return;
      const cleanMax = maxAmount.replace(/[^\d.]/g, "");
      const numMax = parseFloat(cleanMax);
      if (isNaN(numMax)) return;
      const value = ((numMax * percent) / 100).toString();
      onChange(value);
    },
    [maxAmount, onChange],
  );

  const handleMaxClick = useCallback(() => {
    if (!maxAmount || !onChange) return;
    const cleanMax = maxAmount.replace(/[^\d.]/g, "");
    onChange(cleanMax);
  }, [maxAmount, onChange]);

  const usdValue = useMemo(() => {
    if (!ethPrice || !amount) return "";
    const num = parseFloat(amount);
    if (isNaN(num)) return "";
    return `$${(num * ethPrice).toFixed(2)}`;
  }, [ethPrice, amount]);

  return (
    <div
      className={`
        p-4 mt-2 rounded-xl border border-solid bg-white/[0.08] transition-colors
        ${error ? "border-red-500/50" : "border-white/10"}
        max-sm:p-3
      `}
    >
      {/* Label row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          {showInfoIcon && <InfoIcon />}
          <span>{label}</span>
        </div>

        {maxAmount && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Balance:</span>
            <span className="text-white/70">{maxAmount}</span>
            {isInput && onChange && (
              <button
                type="button"
                onClick={handleMaxClick}
                className="px-1.5 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 active:bg-emerald-500/40 transition-colors"
              >
                MAX
              </button>
            )}
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="flex items-center justify-between gap-3">
        {isInput ? (
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={handleChange}
            placeholder="0.0"
            className="
              w-full min-h-[44px] bg-transparent border border-white/10
              rounded-lg px-3 py-2 text-xl text-white font-medium
              placeholder-gray-600
              focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30
              transition-all
              text-[16px] sm:text-xl
            "
            aria-label={label}
          />
        ) : (
          <span className="text-xl text-white font-medium min-h-[44px] flex items-center">
            {amount || "0.0"}
          </span>
        )}

        {showTokenSelector && (
          <button
            className="flex items-center gap-2 shrink-0 min-h-[44px] px-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
            aria-label={`Select token: ${tokenName || "ETH"}`}
          >
            <TokenIcon tokenName={tokenName || "USDT"} />
          </button>
        )}
      </div>

      {/* Percentage quick-pick buttons (only for inputs with a known max) */}
      {isInput && maxAmount && onChange && (
        <div className="flex items-center gap-2 mt-3">
          {PERCENT_PRESETS.map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handlePercentClick(pct)}
              className="
                flex-1 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border
                bg-white/5 border-white/10 text-gray-400
                hover:bg-white/10 hover:text-white
                active:bg-white/15
                transition-colors
              "
            >
              {pct}%
            </button>
          ))}
        </div>
      )}

      {/* USD conversion + validation error */}
      <div className="flex items-center justify-between mt-2 min-h-[18px]">
        {error ? (
          <span className="text-xs text-red-400 font-medium">{error}</span>
        ) : (
          <span className="text-xs text-gray-500">{isInput && usdValue ? usdValue : ""}</span>
        )}
      </div>
    </div>
  );
};
