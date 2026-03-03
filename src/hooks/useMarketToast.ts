import { useToast, UseToastOptions } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";

type ToastStatus = "error" | "success" | "info" | "warning";

export function useMarketToast() {
  const toast = useToast();

  const show = useCallback(
    (status: ToastStatus, title: string, description?: string) => {
      toast({
        title,
        description,
        status,
        duration: 5000,
        isClosable: true,
      });
    },
    [toast]
  );

  return useMemo(
    () => ({
      error: (title: string, description?: string) => show("error", title, description),
      success: (title: string, description?: string) => show("success", title, description),
      info: (title: string, description?: string) => show("info", title, description),
      warning: (title: string, description?: string) => show("warning", title, description),
    }),
    [show]
  );
}
