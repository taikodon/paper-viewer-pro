import type { TranslationResult } from '../types';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';
const FALLBACK_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function buildPrompt(text: string): string {
  return `あなたは学術論文（英語）の読解を助ける専門家です。
以下は英語論文から抽出した一節です。PDF由来の余分な改行（\\n）は無視し、文章を正確に復元してください。

英文:
"${text}"

以下の2点を日本語で回答してください。

1. 【日本語訳】自然で正確な日本語訳
2. 【解説】この文章が論文の文脈で何を述べているかを、平易な日本語で2〜4文で解説してください。
   - 何について主張・説明しているか
   - 専門的な概念・手法が含まれる場合はその意味と役割
   - 論文を読む上で押さえておくべきポイント

JSONのみを返してください（マークダウン・コードブロック不要）:
{
  "translation": "日本語訳",
  "explanation": "解説（2〜4文）"
}`;
}

async function callApi(url: string, apiKey: string, text: string): Promise<TranslationResult> {
  const response = await fetch(`${url}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(text) }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as TranslationResult;
}

export const geminiService = {
  async translate(text: string, apiKey: string): Promise<TranslationResult> {
    try {
      return await callApi(GEMINI_API_URL, apiKey, text);
    } catch {
      return callApi(FALLBACK_API_URL, apiKey, text);
    }
  },
};
