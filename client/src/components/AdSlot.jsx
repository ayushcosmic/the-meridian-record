import { useEffect, useRef } from "react";

let adScriptLoaded = false;

function loadAdSenseScript(clientId) {
  if (adScriptLoaded || !clientId || typeof window === "undefined") return;
  if (document.querySelector(`script[src*="pagead2.googlesyndication.com"]`)) {
    adScriptLoaded = true;
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
  adScriptLoaded = true;
}

export default function AdSlot({
  slotType = "leaderboard",
  slotId = "",
  clientId = "",
  className = "",
  label = "ADVERTISEMENT"
}) {
  const adRef = useRef(null);
  const pushedRef = useRef(false);

  // Check client props, Vite env, or window.__SITE_SETTINGS__
  const effectiveClient = clientId || import.meta.env.VITE_ADSENSE_CLIENT_ID || "";
  const effectiveSlot = slotId || "";

  const isConfigured = Boolean(effectiveClient && effectiveClient.startsWith("ca-pub-") && effectiveSlot);

  useEffect(() => {
    if (isConfigured) {
      loadAdSenseScript(effectiveClient);
      if (!pushedRef.current) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushedRef.current = true;
        } catch (e) {
          console.debug("AdSense push:", e.message);
        }
      }
    }
  }, [isConfigured, effectiveClient, effectiveSlot]);

  const dimensionsMap = {
    leaderboard: "728 × 90 (Desktop) / 320 × 50 (Mobile)",
    rectangle: "300 × 250 Medium Rectangle",
    halfpage: "300 × 600 Half Page Rail",
    "in-feed": "Responsive Fluid In-Feed",
    "in-article": "Responsive In-Article Stream"
  };

  return (
    <aside
      className={`ad-container ad-${slotType} ${className}`}
      aria-label={label}
      role="complementary"
    >
      <div className="ad-label-bar">
        <span className="ad-label-text">{label}</span>
      </div>

      <div className="ad-frame" ref={adRef}>
        {isConfigured ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={effectiveClient}
            data-ad-slot={effectiveSlot}
            data-ad-format={slotType === "rectangle" ? "rectangle" : "auto"}
            data-full-width-responsive="true"
          />
        ) : (
          <div className="ad-placeholder-box">
            <div className="ad-placeholder-header">
              <span className="ad-spec">{dimensionsMap[slotType] || "Display Banner"}</span>
            </div>
            <p className="ad-placeholder-note">
              Placement reserved for verified Google AdSense partner integration.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
