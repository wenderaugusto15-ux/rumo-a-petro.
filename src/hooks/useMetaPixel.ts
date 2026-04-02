export function useMetaPixel() {
  return {
    trackEvent: (_name: string) => {},
    trackCompleteRegistration: () => {},
  };
}
