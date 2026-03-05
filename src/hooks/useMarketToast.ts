import toast from "react-hot-toast";
import { useMemo } from "react";

function format(title: string, description?: string): string {
  return description ? `${title}\n${description}` : title;
}

export function useMarketToast() {
  return useMemo(
    () => ({
      error: (title: string, description?: string) =>
        toast.error(format(title, description)),
      success: (title: string, description?: string) =>
        toast.success(format(title, description)),
      info: (title: string, description?: string) =>
        toast(format(title, description)),
      warning: (title: string, description?: string) =>
        toast(format(title, description), { icon: "\u26A0\uFE0F" }),
    }),
    []
  );
}
