const DB_NAME = "musix_media_cache";
const DB_VERSION = 1;
const STORE_NAME = "cover_art";
export const CACHE_TTL_MS = 48 * 60 * 60 * 1000;

const memoryCache = new Map();
let dbPromise = null;

function getDB() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
            store.createIndex("timestamp", "timestamp", { unique: false });
          }
        };
        request.onsuccess = (event) => {
          const db = event.target.result;
          cleanExpiredCovers(db);
          resolve(db);
        };
        request.onerror = () => {
          resolve(null);
        };
      } catch (e) {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

export async function cleanExpiredCovers(providedDb = null) {
  try {
    const db = providedDb || (await getDB());
    const cutoff = Date.now() - CACHE_TTL_MS;

    for (const [k, v] of memoryCache.entries()) {
      if (v && v.timestamp && v.timestamp < cutoff) {
        memoryCache.delete(k);
      }
    }

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("musix_cover_art_cache_v1");
      }
    } catch (e) {}

    if (!db) return;

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    const range = IDBKeyRange.upperBound(cutoff);
    const req = index.openCursor(range);

    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (err) {}
}

if (typeof window !== "undefined") {
  setTimeout(() => cleanExpiredCovers(), 2000);
  setInterval(() => cleanExpiredCovers(), 60 * 60 * 1000);
}

async function getFromIndexedDB(key) {
  const db = await getDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        const record = req.result;
        if (!record) {
          resolve(null);
          return;
        }

        if (Date.now() - record.timestamp > CACHE_TTL_MS) {
          deleteFromIndexedDB(key);
          resolve(null);
        } else {
          resolve(record);
        }
      };

      req.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function saveToIndexedDB(key, dataUrl, remoteUrl) {
  const db = await getDB();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({
      key,
      dataUrl,
      remoteUrl,
      timestamp: Date.now(),
    });
  } catch (e) {}
}

async function deleteFromIndexedDB(key) {
  const db = await getDB();
  if (!db) return;

  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
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
    .replace(/[\(\[](?:feat|ft|featuring)\.?\s+[^()\[\]]+[\)\]]/gi, "")
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

  const lowerTitle = title.toLowerCase();
  const isGenericTitle =
    !title || /^track\s*\d+$/i.test(lowerTitle) || /^\d+$/.test(lowerTitle);

  if (isGenericTitle && cleanedFile) {
    if (cleanedFile.includes(" - ")) {
      const parts = cleanedFile.split(" - ");
      if (!artist) artist = parts[0].trim();
      title = parts.slice(1).join(" - ").trim();
    } else {
      title = cleanedFile;
    }
  }

  if (artist) artist = cleanQueryString(artist);
  if (title) title = cleanQueryString(title);
  if (album) album = cleanQueryString(album);

  return { artist, title, album, fallbackQuery: cleanedFile };
}

export function makeCacheKey(artist, title, filepath) {
  const normArtist = (artist || "").toLowerCase().trim();
  const normTitle = (title || "").toLowerCase().trim();
  if (normArtist || normTitle) {
    return `${normArtist}___${normTitle}`;
  }
  const normFile = (filepath || "").toLowerCase().split(/[/\\]/).pop() || "";
  return normFile;
}

export async function getCachedCoverArt(meta, fileName, filepath) {
  const { artist, title, fallbackQuery } = parseTrackSearchInfo(
    meta,
    fileName,
    filepath,
  );
  const key = makeCacheKey(artist, title, filepath || fallbackQuery);
  const cutoff = Date.now() - CACHE_TTL_MS;

  if (memoryCache.has(key)) {
    const mem = memoryCache.get(key);
    if (mem && mem.timestamp > cutoff) {
      return mem.dataUrl || null;
    }
    memoryCache.delete(key);
  }

  const record = await getFromIndexedDB(key);
  if (record && record.dataUrl) {
    memoryCache.set(key, {
      dataUrl: record.dataUrl,
      timestamp: record.timestamp,
    });
    return record.dataUrl;
  }

  return null;
}

export async function setCachedCoverArt(
  meta,
  fileName,
  filepath,
  dataUrl,
  remoteUrl = null,
) {
  const { artist, title, fallbackQuery } = parseTrackSearchInfo(
    meta,
    fileName,
    filepath,
  );
  const key = makeCacheKey(artist, title, filepath || fallbackQuery);
  const timestamp = Date.now();

  memoryCache.set(key, {
    dataUrl: dataUrl || null,
    timestamp,
  });

  if (dataUrl) {
    await saveToIndexedDB(key, dataUrl, remoteUrl);
  }
}

export function getHighResArtworkUrl(rawUrl, size = 600) {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  if (rawUrl.includes("mzstatic.com")) {
    return rawUrl
      .replace(
        /\/\d+x\d+[^\/]*(\.[a-zA-Z0-9]+)$/i,
        (m, ext) => `/${size}x${size}bb${ext}`,
      )
      .replace(/\/\d+x\d+bb/g, `/${size}x${size}bb`);
  }
  return rawUrl;
}

export async function fetchImageAsDataUrl(url) {
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("data:")) return url;

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob || blob.size === 0) return null;

    if (typeof FileReader !== "undefined") {
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result;
          if (typeof res === "string" && res.startsWith("data:image/")) {
            resolve(res);
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } else {
      const buffer = await blob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mime = blob.type || "image/jpeg";
      return `data:${mime};base64,${base64}`;
    }
  } catch (err) {
    return null;
  }
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
  if (typeof navigator !== "undefined" && navigator.onLine === false) return [];

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term.trim())}&limit=5${extraParams}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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

  const cached = await getCachedCoverArt(meta, fileName, filepath);
  if (cached) return cached;

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return null;
  }

  const { artist, title, album, fallbackQuery } = parseTrackSearchInfo(
    meta,
    fileName,
    filepath,
  );

  const rawQueries = [];
  if (artist && title) {
    rawQueries.push({
      term: `${artist} ${title}`,
      params: "&media=music&entity=song",
    });
    rawQueries.push({ term: `${artist} ${title}`, params: "&media=music" });
  }
  if (title) {
    rawQueries.push({ term: title, params: "&media=music&entity=song" });
  }
  if (artist && album && album.toLowerCase() !== title.toLowerCase()) {
    rawQueries.push({ term: `${artist} ${album}`, params: "&entity=album" });
  }
  if (fallbackQuery && fallbackQuery.toLowerCase() !== title.toLowerCase()) {
    rawQueries.push({ term: fallbackQuery, params: "&media=music" });
  }

  const seenTerms = new Set();
  const queries = [];
  for (const q of rawQueries) {
    const key = `${q.term}::${q.params}`;
    if (!seenTerms.has(key)) {
      seenTerms.add(key);
      queries.push(q);
    }
  }

  for (const q of queries) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return null;
    }

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
        const highRes = getHighResArtworkUrl(rawArt, 600);

        let localDataUrl = await fetchImageAsDataUrl(highRes);
        if (!localDataUrl && rawArt !== highRes) {
          localDataUrl = await fetchImageAsDataUrl(rawArt);
        }

        if (localDataUrl) {
          await setCachedCoverArt(
            meta,
            fileName,
            filepath,
            localDataUrl,
            highRes,
          );
          return localDataUrl;
        }
      }
    }
  }

  await setCachedCoverArt(meta, fileName, filepath, null);
  return null;
}
