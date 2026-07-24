import { createHash } from 'crypto';

interface AnubisChallenge {
  rules: { algorithm: string; difficulty: number };
  challenge: {
    id: string;
    method: string;
    randomData: string;
    difficulty: number;
  };
}

function solvePow(randomData: string, difficulty: number): string {
  const dataBuf = Buffer.from(randomData, 'hex');
  const prefix = '0'.repeat(Math.ceil(difficulty / 4));

  for (let nonce = 0; nonce < 1_000_000; nonce++) {
    const nonceBuf = Buffer.from(nonce.toString(16).padStart(8, '0'), 'hex');
    const hash = createHash('sha256').update(dataBuf).update(nonceBuf).digest('hex');
    if (hash.startsWith(prefix)) {
      return nonce.toString(16).padStart(8, '0');
    }
  }
  return '';
}

export async function solveAnubisChallenge(targetUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(targetUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      },
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    const match = html.match(/<script\s+id="anubis_challenge"\s+type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) return null;

    const data: AnubisChallenge = JSON.parse(match[1]);
    const { id, randomData, difficulty } = data.challenge;

    const solution = solvePow(randomData, difficulty);
    if (!solution) return null;

    const baseUrl = new URL(targetUrl).origin;
    const tokenResp = await fetch(`${baseUrl}/.within.website/x/cmd/anubis/api/make-challenge-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ id, nonce: solution }),
      signal: AbortSignal.timeout(8000),
    });

    if (!tokenResp.ok) return null;

    const cookies = tokenResp.headers.getSetCookie?.() || [];
    const captchaCookie = cookies.find((c: string) => c.startsWith('captcha_token='));
    if (captchaCookie) {
      return captchaCookie.split(';')[0].split('=').slice(1).join('=');
    }

    const body = await tokenResp.json().catch(() => null);
    return body?.token || null;
  } catch {
    return null;
  }
}
