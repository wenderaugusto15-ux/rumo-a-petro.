import { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

const getPixelId = (): string | null => {
  return import.meta.env.VITE_META_PIXEL_ID || null;
};

const isPixelLoaded = (): boolean => {
  return typeof window.fbq === "function";
};

export function useMetaPixel() {
  const trackPageView = useCallback(() => {
    if (isPixelLoaded()) {
      window.fbq("track", "PageView");
    }
  }, []);

  const trackEvent = useCallback((eventName: string, params?: Record<string, any>) => {
    if (isPixelLoaded()) {
      window.fbq("trackCustom", eventName, params);
    }
  }, []);

  const trackStandardEvent = useCallback((eventName: string, params?: Record<string, any>) => {
    if (isPixelLoaded()) {
      window.fbq("track", eventName, params);
    }
  }, []);

  const trackPurchase = useCallback((value: number, currency = "BRL") => {
    if (isPixelLoaded()) {
      window.fbq("track", "Purchase", { value, currency });
    }
  }, []);

  const trackLead = useCallback(() => {
    if (isPixelLoaded()) {
      window.fbq("track", "Lead");
    }
  }, []);

  const trackCompleteRegistration = useCallback(() => {
    if (isPixelLoaded()) {
      window.fbq("track", "CompleteRegistration");
    }
  }, []);

  const trackStartTrial = useCallback(() => {
    if (isPixelLoaded()) {
      window.fbq("track", "StartTrial");
    }
  }, []);

  const trackSubscribe = useCallback((value: number, currency = "BRL") => {
    if (isPixelLoaded()) {
      window.fbq("track", "Subscribe", { value, currency });
    }
  }, []);

  const trackInitiateCheckout = useCallback((params?: Record<string, any>) => {
    if (isPixelLoaded()) {
      window.fbq("track", "InitiateCheckout", params);
    }
  }, []);

  return {
    trackPageView,
    trackEvent,
    trackStandardEvent,
    trackPurchase,
    trackLead,
    trackCompleteRegistration,
    trackStartTrial,
    trackSubscribe,
    trackInitiateCheckout,
  };
}

/** Auto-track PageView on route changes for /app/* pages */
export function useMetaPixelPageView() {
  const location = useLocation();
  const { trackPageView } = useMetaPixel();

  useEffect(() => {
    if (location.pathname.startsWith("/app")) {
      trackPageView();
    }
  }, [location.pathname, trackPageView]);
}
