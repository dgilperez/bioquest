import { INatObservation, INatTaxon } from '@/types';

export class INatAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'INatAPIError';
  }
}

export interface INatClientOptions {
  accessToken?: string;
}

export interface GetObservationsOptions {
  per_page?: number;
  page?: number;
  order_by?: 'created_at' | 'observed_on' | 'id';
  order?: 'desc' | 'asc';
  quality_grade?: 'research' | 'needs_id' | 'casual';
  taxon_id?: number;
  place_id?: number;
  d1?: string; // date from (YYYY-MM-DD)
  d2?: string; // date to (YYYY-MM-DD)
  updated_since?: string; // ISO 8601 timestamp - for incremental sync
  id_above?: number; // fetch observations with ID > this value
}

export class INatClient {
  private static readonly BASE_URL = 'https://api.inaturalist.org/v1';
  private static readonly RATE_LIMIT_PER_MINUTE = 60;
  private accessToken?: string;
  private requestTimestamps: number[] = [];

  constructor(options?: INatClientOptions) {
    this.accessToken = options?.accessToken;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);

    // If we've hit the rate limit, wait
    if (this.requestTimestamps.length >= INatClient.RATE_LIMIT_PER_MINUTE) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestRequest) + 100; // Add 100ms buffer
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.enforceRateLimit(); // Re-check after waiting
      }
    }

    this.requestTimestamps.push(now);
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    await this.enforceRateLimit();

    const url = `${INatClient.BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Merge with provided headers
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new INatAPIError(
          `iNaturalist API error: ${response.statusText}`,
          response.status,
          await response.text()
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof INatAPIError) {
        throw error;
      }
      throw new INatAPIError(
        `Failed to fetch from iNaturalist: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get observations for a specific user
   */
  async getUserObservations(
    username: string,
    options: GetObservationsOptions = {}
  ): Promise<{
    total_results: number;
    page: number;
    per_page: number;
    results: INatObservation[];
  }> {
    const params = new URLSearchParams({
      user_login: username,
      per_page: (options.per_page || 50).toString(),
      page: (options.page || 1).toString(),
      order_by: options.order_by || 'observed_on',
      order: options.order || 'desc',
    });

    if (options.quality_grade) {
      params.append('quality_grade', options.quality_grade);
    }
    if (options.taxon_id) {
      params.append('taxon_id', options.taxon_id.toString());
    }
    if (options.place_id) {
      params.append('place_id', options.place_id.toString());
    }
    if (options.d1) {
      params.append('d1', options.d1);
    }
    if (options.d2) {
      params.append('d2', options.d2);
    }
    if (options.updated_since) {
      params.append('updated_since', options.updated_since);
    }
    if (options.id_above) {
      params.append('id_above', options.id_above.toString());
    }

    return this.request(`/observations?${params.toString()}`);
  }

  /**
   * Get species counts for a user
   */
  async getUserSpeciesCounts(
    username: string,
    options: Pick<GetObservationsOptions, 'taxon_id' | 'place_id'> = {}
  ): Promise<{
    total_results: number;
    page: number;
    per_page: number;
    results: Array<{
      count: number;
      taxon: INatTaxon;
    }>;
  }> {
    const params = new URLSearchParams({
      user_login: username,
      per_page: '200', // Get more species at once
    });

    if (options.taxon_id) {
      params.append('taxon_id', options.taxon_id.toString());
    }
    if (options.place_id) {
      params.append('place_id', options.place_id.toString());
    }

    return this.request(`/observations/species_counts?${params.toString()}`);
  }

  /**
   * Get taxon information
   */
  async getTaxon(taxonId: number): Promise<{
    results: INatTaxon[];
  }> {
    return this.request(`/taxa/${taxonId}`);
  }

  /**
   * Get observation counts for a taxon (to determine rarity)
   */
  async getTaxonObservationCount(
    taxonId: number,
    placeId?: number
  ): Promise<number> {
    const params = new URLSearchParams({
      taxon_id: taxonId.toString(),
      per_page: '0', // We only want the count, not the results
    });

    if (placeId) {
      params.append('place_id', placeId.toString());
    }

    const response = await this.request<{
      total_results: number;
    }>(`/observations?${params.toString()}`);

    return response.total_results;
  }

  /**
   * Get user info
   */
  async getUserInfo(userId: number): Promise<{
    results: Array<{
      id: number;
      login: string;
      name: string;
      icon: string | null;
      observations_count: number;
      species_count: number;
      identifications_count: number;
    }>;
  }> {
    return this.request(`/users/${userId}`);
  }

  /**
   * Search for taxa
   */
  async searchTaxa(query: string, options: { per_page?: number } = {}): Promise<{
    total_results: number;
    results: INatTaxon[];
  }> {
    const params = new URLSearchParams({
      q: query,
      per_page: (options.per_page || 20).toString(),
    });

    return this.request(`/taxa?${params.toString()}`);
  }
}

// Singleton instance for server-side usage
let clientInstance: INatClient | null = null;

export function getINatClient(accessToken?: string): INatClient {
  if (!clientInstance || (accessToken && clientInstance['accessToken'] !== accessToken)) {
    clientInstance = new INatClient({ accessToken });
  }
  return clientInstance;
}
