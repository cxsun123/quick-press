import 'server-only';

export interface AiRequestParams {
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  reasoning_effort?: string;
  stream?: boolean;
  thinking?: { type: string };
}

export interface AiRequestResult {
  text: string;
  latencyMs: number;
}

export async function aiRequest(
  baseURL: string,
  apiKey: string,
  model: string,
  params: AiRequestParams,
  signal?: AbortSignal,
): Promise<AiRequestResult> {
  const normalizedBase = baseURL.replace(/\/chat\/completions\/?$/, '').replace(/\/+$/, '');
  const apiUrl = `${normalizedBase}/chat/completions`;

  const body = {
    model,
    messages: params.messages,
    temperature: params.temperature,
    max_tokens: params.max_tokens,
    reasoning_effort: params.reasoning_effort ?? 'high',
    stream: params.stream ?? false,
    thinking: params.thinking ?? { type: 'disabled' },
  };

  const start = Date.now();
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  const latencyMs = Date.now() - start;

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(errText.slice(0, 200) || response.statusText);
    (err as any).status = response.status;
    throw err;
  }

  const data = await response.json();
  let text = '';

  const msg = data.choices?.[0]?.message;
  if (msg?.content) {
    text = msg.content;
  } else if (msg?.reasoning_content) {
    text = msg.reasoning_content;
  } else if (data.choices?.[0]?.text) {
    text = data.choices[0].text;
  } else if (data.response) {
    text = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
  }

  return { text, latencyMs };
}
