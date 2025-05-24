export interface RankApiResponse {
  rank: number | null;
}

export const coinbaseRankFetcher = async (
  url: string
): Promise<{ rank: number }> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const data: RankApiResponse = await res.json();
  return { rank: data.rank !== null ? data.rank : 201 };
};