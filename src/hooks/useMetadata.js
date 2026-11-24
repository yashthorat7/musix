import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useMetadata() {
  const [metadata, setMetadata] = useState(null);

  const extractMetadata = useCallback(async (path) => {
    try {
      const result = await invoke("extract_metadata", { filepath: path });
      setMetadata(result);
      return result;
    } catch (error) {
      return null;
    }
  }, []);

  return { metadata, extractMetadata, setMetadata };
}
