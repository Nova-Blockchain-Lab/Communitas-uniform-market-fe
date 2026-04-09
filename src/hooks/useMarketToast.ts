import toast from "react-hot-toast";
import { useCallback, useMemo } from "react";

function format(title: string, description?: string): string {
  return description ? `${title}\n${description}` : title;
}

interface UseMarketToastReturn {
  error: (title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

export function useMarketToast(): UseMarketToastReturn {
  const error = useCallback(
    (title: string, description?: string) => toast.error(format(title, description)),
    []
  );

  const success = useCallback(
    (title: string, description?: string) => toast.success(format(title, description)),
    []
  );

  const info = useCallback(
    (title: string, description?: string) => toast(format(title, description)),
    []
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      toast(format(title, description), { icon: "\u26A0\uFE0F" }),
    []
  );

  return useMemo(
    () => ({ error, success, info, warning }),
    [error, success, info, warning]
  );
}
