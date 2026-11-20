import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useMetadata() {
  const [metadata, setMetadata] = useState(null);

  const extractMetadata = useCallback(async (path) => {
    try {
      const metadata = await invoke("extract_metadata", { filepath: path });
      setMetadata(metadata);
      return metadata;
    } catch (error) {
      return null;
    }
  }, []);

  return { metadata, extractMetadata, setMetadata };
}
