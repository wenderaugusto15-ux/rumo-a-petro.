/** Initialize Meta Pixel script. Called once from App. */
export function initMetaPixel() {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (!pixelId || typeof window === "undefined") return;

  // Avoid double-init
  if (typeof (window as any).fbq === "function") return;

  const w = window as any;
  const d = document as any;

  const n = (w.fbq = function () {
    // eslint-disable-next-line prefer-rest-params
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  });
  if (!w._fbq) w._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [] as any[];

  const t = d.createElement("script");
  t.async = true;
  t.src = "https://connect.facebook.net/en_US/fbevents.js";
  const s = d.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(t, s);

  w.fbq("init", pixelId);
  w.fbq("track", "PageView");
}
