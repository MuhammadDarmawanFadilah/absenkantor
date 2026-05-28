import { getApiUrl } from './config';

export interface KodeposResponse {
  kodepos: string;
}

export async function getKodeposByWilayah(kodeWilayah: string): Promise<string | null> {
  try {
    const response = await fetch(getApiUrl(`wilayah-kodepos/kodepos/${kodeWilayah}`), {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    if (response.ok) {
      return await response.text();
    } else if (response.status === 404) {
      return null;
    } else {
      throw new Error(`Failed to fetch kodepos: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching kodepos:', error);
    return null;
  }
}
