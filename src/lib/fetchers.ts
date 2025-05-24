export interface RankApiResponse {
  financeRank: number | null;
  overallRank: number | null;
}

export interface RankData {
  financeRank: number;
  overallRank: number;
}

export const coinbaseRankFetcher = async (
  url: string
): Promise<RankData> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data: RankApiResponse = await res.json();
  return { 
    financeRank: data.financeRank !== null ? data.financeRank : 999,
    overallRank: data.overallRank !== null ? data.overallRank : 999
  };
};