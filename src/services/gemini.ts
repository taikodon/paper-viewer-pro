import type { TranslationResult } from '../types';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';
const FALLBACK_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function buildPrompt(text: string): string {
  return `あなたは学術論文の翻訳と専門用語解説の専門家です。以下の英文はPDFから抽出したテキストです。
PDF特有の不要な改行コード（\\n）を無視して元の文章を正確に復元した上で、以下の2点を日本語で回答してください。

英文:
"${text}"

回答形式（必ずこのJSON形式で返してください）:
{
  "translation": "日本語訳をここに記載",
  "explanation": "専門用語の解説をここに記載（箇条書き可）"
}

注意: JSONのみを返し、余分なマークダウンや説明文は不要です。`;
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
