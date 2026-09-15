
if (window.innerWidth <= 768 && !new URLSearchParams(window.location.search).has("proceed")) {
  window.location.href = "/mobile.html";
}

addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("nowplaying");
  if (!box) return;
  const text = document.getElementById("np-text");
  const cover = document.getElementById("np-cover");

  const setText = (t) => { if (text.textContent !== t) text.textContent = t; };
  const setCover = (src) => {
    const target = src || "images/silence.jpg";
    if (cover.getAttribute("src") !== target) cover.setAttribute("src", target);
    cover.classList.add("visible");
  };

  let dots = 0;
  let dotsTimer = null;

  const startDots = () => {
    setCover(null);
    if (dotsTimer) return;
    setText("NOTHING_PLAYING");
    dotsTimer = setInterval(() => {
      dots = (dots + 1) % 4;
      setText("NOTHING_PLAYING" + ".".repeat(dots));
    }, 400);
  };

  const stopDots = () => {
    if (!dotsTimer) return;
    clearInterval(dotsTimer);
    dotsTimer = null;
  };

  cover.addEventListener("error", () => {
    if (cover.getAttribute("src") !== "images/silence.jpg") {
      cover.setAttribute("src", "images/silence.jpg");
    }
  });

  const covers = new Map();
  let currentKey = null;

  const coverFor = async (meta) => {
    if (meta.mbid_mapping && meta.mbid_mapping.caa_release_mbid) {
      return `https://coverartarchive.org/release/${meta.mbid_mapping.caa_release_mbid}/front-250`;
    }
    try {
      const q = new URLSearchParams({ term: `${meta.artist_name} ${meta.track_name}`, entity: "song", limit: "1" });
      const res = await fetch(`https://itunes.apple.com/search?${q}`);
      if (!res.ok) throw new Error(res.status);
      const { results } = await res.json();
      const art = results && results[0] && results[0].artworkUrl100;
      return art ? art.replace("100x100bb", "600x600bb") : null;
    } catch (_) {
      return;
    }
  };

  const render = (meta) => {
    if (!meta) { currentKey = null; return startDots(); }
    stopDots();
    const key = `${meta.artist_name}|${meta.track_name}`;
    currentKey = key;
    setCover(covers.has(key) ? covers.get(key) : null);
    const track = [meta.track_name, meta.artist_name].filter(Boolean).join(" – ") || "Unknown";
    setText(`${track}${meta.release_name ? ` (${meta.release_name})` : ""}`);
    if (!covers.has(key)) {
      coverFor(meta).then((url) => {
        if (url === undefined) return;
        covers.set(key, url);
        if (currentKey === key) setCover(url);
      });
    }
  };

  const poll = async () => {
    try {
      const res = await fetch("https://api.listenbrainz.org/1/user/alpwrk/playing-now");
      if (!res.ok) throw new Error(res.status);
      const { payload } = await res.json();
      render(payload.playing_now && payload.listens.length ? payload.listens[0].track_metadata : null);
    } catch (_) {
      render(null);
    }
  };

  render(null);
  poll();
  setInterval(poll, 30000);
});
