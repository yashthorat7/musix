export const SUPPORTED_EXTENSIONS = [
  ".mp3",
  ".wav",
  ".flac",
  ".ogg",
  ".m4a",
  ".aac",
  ".opus",
  ".wma",
];

export const ACCEPT_AUDIO_STRING = SUPPORTED_EXTENSIONS.join(",");

export function isAudioFile(filenameOrPath) {
  if (!filenameOrPath || typeof filenameOrPath !== "string") return false;
  const lower = filenameOrPath.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function getCleanTitle(filepath, metaTitle) {
  if (metaTitle && typeof metaTitle === "string" && metaTitle.trim()) {
    return metaTitle.trim();
  }
  if (!filepath || typeof filepath !== "string") return "Musix";
  const filename = filepath.split(/[/\\]/).pop() || "";
  const dotIndex = filename.lastIndexOf(".");
  const nameWithoutExt =
    dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
  const cleaned = nameWithoutExt.replace(/[_-]/g, " ").trim();
  return cleaned || "Musix";
}
