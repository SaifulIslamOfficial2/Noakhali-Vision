import { useCallback } from "react";

// Push notifications are not connected to any server yet, so the bell is hidden ("unsupported")
// instead of pretending to subscribe visitors. Replace this hook when a real push service
// (e.g. OneSignal / Web Push with VAPID keys) is added.
export function usePushNotification() {
  const noop = useCallback(async () => {}, []);
  return { status: "unsupported", loading: false, subscribe: noop, unsubscribe: noop };
}
