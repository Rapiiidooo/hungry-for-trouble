// The collection ID is public; dashboard access and proxy configuration stay private.
const website = "92113d9d-fdd2-4ea2-aecf-e9e587fa26f5";
const domain = "trouble.rapidoai.dev";

function optedOut() {
  return (
    navigator.globalPrivacyControl === true ||
    [navigator.doNotTrack, window.doNotTrack, navigator.msDoNotTrack].some(
      (value) => value === "1" || value === 1 || value === "yes",
    )
  );
}

if (location.hostname === domain && !optedOut()) {
  window.hftAnalyticsPayload = (type, payload) => {
    if (optedOut() || type !== "event" || payload.name || payload.id)
      return false;
    let referrer = "";
    try {
      const source = new URL(payload.referrer);
      if (["http:", "https:"].includes(source.protocol))
        referrer = source.origin;
    } catch {
      // Direct visits have no referring site.
    }
    return {
      website,
      hostname: domain,
      url: location.pathname,
      title: "Hungry for Trouble",
      referrer,
      screen: payload.screen,
      language: payload.language,
    };
  };

  const tracker = document.createElement("script");
  tracker.async = true;
  tracker.src = "/analytics/script.js";
  Object.assign(tracker.dataset, {
    websiteId: website,
    hostUrl: `${location.origin}/analytics`,
    domains: domain,
    excludeSearch: "true",
    excludeHash: "true",
    doNotTrack: "true",
    fetchCredentials: "omit",
    beforeSend: "hftAnalyticsPayload",
  });
  document.head.append(tracker);
}
