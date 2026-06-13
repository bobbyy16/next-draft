declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void; escape?: boolean };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description?: string } }) => void) => void;
  close: () => void;
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export interface OpenCheckoutArgs {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  packLabel: string;
  user: { name?: string; email?: string };
  onSuccess: (response: RazorpayHandlerResponse) => void;
  onDismiss?: () => void;
  onFailure?: (description?: string) => void;
}

export async function openRazorpayCheckout(args: OpenCheckoutArgs): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    args.onFailure?.("Could not load payment checkout. Please refresh and try again.");
    return;
  }

  const checkout = new window.Razorpay({
    key: args.keyId,
    amount: args.amountPaise,
    currency: args.currency,
    name: "NextDraft",
    description: args.packLabel,
    order_id: args.orderId,
    prefill: {
      name: args.user.name,
      email: args.user.email,
    },
    theme: { color: "#0f766e" },
    modal: { ondismiss: args.onDismiss, escape: true },
    handler: (response) => args.onSuccess(response),
  });

  checkout.on("payment.failed", (response) => {
    args.onFailure?.(response.error?.description);
  });

  checkout.open();
}
