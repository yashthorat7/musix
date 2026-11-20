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
  if (metaTitle && metaTitle.trim()) return metaTitle.trim();
  if (!filepath) return "Musix";
  const filename = filepath.split(/[/\\]/).pop() || "";
  const nameWithoutExt =
    filename.substring(0, filename.lastIndexOf(".")) || filename;
  return nameWithoutExt.replace(/[_-]/g, " ").trim();
}
