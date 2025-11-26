import { useSystemStore } from "@/stores/systemStore";

export function useSafeMode() {
  const {
    safeMode,
    crashCount,
    exitSafeMode,
    recordCrash,
  } = useSystemStore();
  
  return {
    safeMode,
    crashCount,
    exitSafeMode,
    recordCrash,
  };
}
