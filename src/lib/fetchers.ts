export interface RankApiResponse {
  financeRank: number | null;
  overallRank: number | null;
}

export interface RankData {
  financeRank: number | null;
  overallRank: number | null;
}

export const coinbaseRankFetcher = async (
  url: string
): Promise<RankData> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data: RankApiResponse = await res.json();
  // Simply pass through the values without converting null to 999
  return { 
    financeRank: data.financeRank,
    overallRank: data.overallRank
  };
};