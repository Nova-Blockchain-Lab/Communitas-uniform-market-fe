import toast from "react-hot-toast";

const format = (title: string, description?: string) =>
  description ? `${title}\n${description}` : title;

const marketToast = {
  error: (title: string, description?: string) => toast.error(format(title, description)),
  success: (title: string, description?: string) => toast.success(format(title, description)),
  info: (title: string, description?: string) => toast(format(title, description)),
  warning: (title: string, description?: string) =>
    toast(format(title, description), { icon: "\u26A0\uFE0F" }),
};

/** Title plus optional description toasts. The object is stable, so it is safe in hook deps. */
export const useMarketToast = () => marketToast;
