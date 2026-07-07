import { useQuery } from "@tanstack/react-query";
import type { TreasuryPayload } from "../types";

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

const fetchTreasuryYields = async (): Promise<TreasuryPayload> => {
  const response = await fetch("/api/yields", {
    headers: {
      Accept: "application/json"
    }
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error ?? "Treasury data request failed.");
  }

  return payload;
};

export function useTreasuryYields() {
  return useQuery({
    queryKey: ["treasury-yields"],
    queryFn: fetchTreasuryYields,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000
  });
}

