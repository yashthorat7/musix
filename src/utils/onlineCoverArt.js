const CACHE_STORAGE_KEY = "musix_cover_art_cache_v1";
const memoryCache = new Map();

function getStorageCache() {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveStorageCache(cacheObj) {
  try {
    const keys = Object.keys(cacheObj);
    if (keys.length > 500) {
      const trimmed = {};
      keys.slice(-300).forEach((k) => {
        trimmed[k] = cacheObj[k];
      });
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(trimmed));
      return;
    }
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
  } catch (e) {}
}

export function cleanQueryString(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .replace(/\.[a-zA-Z0-9]{2,5}$/, "")
    .replace(
      /^(?:\[[^\]]*(?:downloader|download|spotify|youtube|mp3)[^\]]*\]|y2mate\.com|yt1s\.com|spotifydown\.com|spotify-downloader\.com|ssyoutube\.com|tubidy|djmaza|songs\.pk)[\s._\-]*/i,
      "",
    )
    .replace(/^[0-9]+[\s._\-]+/, "")
    .replace(/[\u2010-\u2015\u2212~]/g, " - ")
    .replace(/[_\+]/g, " ")
    .replace(
      /\[(?:[^\]]*?(?:official|audio|video|lyrics|remaster|hq|hd|1080|4k|320|kbps|flac|download|bonus|ost|single|extended|mix)[^\]]*?)\]/gi,
      "",
    )
    .replace(
      /\((?:[^\)]*?(?:official|audio|video|lyrics|remaster|hq|hd|1080|4k|320|kbps|flac|download|bonus|ost|single|extended|mix)[^\)]*?)\)/gi,
      "",
    )
    .replace(/\s+(?:feat|ft|featuring)\.?\s+[^()\-_\[\]]+/gi, "")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTrackSearchInfo(meta, fileName, filepath) {
  let artist = (meta?.artist || "").trim();
  let title = (meta?.title || "").trim();
  let album = (meta?.album || "").trim();

  const lowerArtist = artist.toLowerCase();
  if (
    lowerArtist === "unknown artist" ||
    lowerArtist === "unknown" ||
    lowerArtist === "various artists"
  ) {
    artist = "";
  }

  const rawName =
    fileName || (filepath ? filepath.split(/[/\\]/).pop() : "") || "";
  const cleanedFile = cleanQueryString(rawName);

  if (!artist && cleanedFile.includes(" - ")) {
    const parts = cleanedFile.split(" - ");
    artist = parts[0].trim();
    title = parts.slice(1).join(" - ").trim();
  }

  if (!title) {
    title = cleanedFile || cleanQueryString(meta?.title || "");
  } else {
    title = cleanQueryString(title);
  }

  if (artist) artist = cleanQueryString(artist);
  if (album) album = cleanQueryString(album);

  return { artist, title, album, fallbackQuery: cleanedFile };
}

function makeCacheKey(artist, title, filepath) {
  const normArtist = (artist || "").toLowerCase().trim();
  const normTitle = (title || "").toLowerCase().trim();
  if (normArtist || normTitle) {
    return `${normArtist}___${normTitle}`;
  }
  const normFile = (filepath || "").toLowerCase().split(/[/\\]/).pop() || "";
  return normFile;
}

export function getCachedCoverArt(meta, fileName, filepath) {
  const { artist, title, fallbackQuery } = parseTrackSearchInfo(
    meta,
    fileName,
    filepath,
  );
  const key = makeCacheKey(artist, title, filepath || fallbackQuery);

  if (memoryCache.has(key)) {
    const mem = memoryCache.get(key);
    return mem === "NONE" ? null : mem;
  }

  const storage = getStorageCache();
  if (key in storage) {
    const stored = storage[key];
    memoryCache.set(key, stored);
    return stored === "NONE" ? null : stored;
  }

  return null;
}

export function setCachedCoverArt(meta, fileName, filepath, url) {
  const { artist, title, fallbackQuery } = parseTrackSearchInfo(
    meta,
    fileName,
    filepath,
  );
  const key = makeCacheKey(artist, title, filepath || fallbackQuery);
  const val = url || "NONE";

  memoryCache.set(key, val);

  const storage = getStorageCache();
  storage[key] = val;
  saveStorageCache(storage);
}

function scoreCandidate(item, artist, title) {
  let score = 0;
  const candidateArtist = (item.artistName || "").toLowerCase();
  const candidateTitle = (
    item.trackName ||
    item.collectionName ||
    ""
  ).toLowerCase();
  const queryArtist = (artist || "").toLowerCase();
  const queryTitle = (title || "").toLowerCase();

  if (queryTitle) {
    if (candidateTitle === queryTitle) {
      score += 50;
    } else if (
      candidateTitle.includes(queryTitle) ||
      queryTitle.includes(candidateTitle)
    ) {
      score += 35;
    } else {
      const tokens = queryTitle.split(/\s+/).filter((w) => w.length > 2);
      const matched = tokens.filter((t) => candidateTitle.includes(t));
      if (tokens.length > 0) {
        score += Math.round((matched.length / tokens.length) * 30);
      }
    }
  }

  if (queryArtist) {
    if (candidateArtist === queryArtist) {
      score += 40;
    } else if (
      candidateArtist.includes(queryArtist) ||
      queryArtist.includes(candidateArtist)
    ) {
      score += 25;
    } else {
      const tokens = queryArtist.split(/\s+/).filter((w) => w.length > 2);
      const matched = tokens.filter((t) => candidateArtist.includes(t));
      if (tokens.length > 0) {
        score += Math.round((matched.length / tokens.length) * 20);
      }
    }
  }

  const badJunk = ["karaoke", "tribute", "instrumental version", "ringtone"];
  if (
    badJunk.some((j) => candidateTitle.includes(j) && !queryTitle.includes(j))
  ) {
    score -= 30;
  }

  return score;
}

async function queryItunes(term, extraParams = "") {
  if (!term || term.trim().length === 0) return [];
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&limit=5${extraParams}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch (e) {
    return [];
  }
}

export async function fetchOnlineCoverArt(meta, fileName, filepath) {
  if (meta?.cover_art && meta.cover_art.length > 50) {
    return meta.cover_art;
  }

  const cached = getCachedCoverArt(meta, fileName, filepath);
  if (cached) return cached;

  const { artist, title, album, fallbackQuery } = parseTrackSearchInfo(
    meta,
    fileName,
    filepath,
  );

  const queries = [];
  if (artist && title) {
    queries.push({ term: `${artist} ${title}`, params: "&media=music" });
  }
  if (title) {
    queries.push({ term: title, params: "&media=music" });
  }
  if (artist && album && album !== title) {
    queries.push({ term: `${artist} ${album}`, params: "&entity=album" });
  }
  if (fallbackQuery && fallbackQuery !== title) {
    queries.push({ term: fallbackQuery, params: "&media=music" });
  }

  for (const q of queries) {
    const candidates = await queryItunes(q.term, q.params);
    if (candidates && candidates.length > 0) {
      let bestItem = null;
      let highestScore = -1;

      for (const item of candidates) {
        const art = item.artworkUrl100 || item.artworkUrl60;
        if (!art) continue;

        const score = scoreCandidate(item, artist, title);
        if (score > highestScore) {
          highestScore = score;
          bestItem = item;
        }
      }

      if (bestItem && highestScore >= 15) {
        const rawArt = bestItem.artworkUrl100 || bestItem.artworkUrl60;
        const highRes = rawArt
          .replace(/100x100bb(\.[a-z]+)$/i, "600x600bb$1")
          .replace(/60x60bb(\.[a-z]+)$/i, "600x600bb$1");

        setCachedCoverArt(meta, fileName, filepath, highRes);
        return highRes;
      }
    }
  }

  setCachedCoverArt(meta, fileName, filepath, null);
  return null;
}
