export function useMetaPixel() {
  return {
    trackEvent: (_name: string) => {
      // UTMify handles tracking automatically via index.html script
    },
    trackCompleteRegistration: () => {
      // UTMify handles tracking automatically via index.html script
    },
  };
}
