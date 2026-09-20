// Vercel Serverless Function - AI Proxy (v2)
// Deploy: upload this folder to Vercel
// URL will be: https://your-app.vercel.app/api/ask
//
// Provider priority chain:
//   1. Vyceai.com  (deepseek-v4.1)        - main
//   2. xKiro.com   (qwen/qwen3.8-omni-flash:free) - first fallback
//   3. Gemini      (gemini-2.5-flash)             - second fallback
//
// Original repo: https://github.com/Erik9910x/ai-proxy

const PROMPT = `Bạn là Chuyên gia giải đề thi Quốc gia với độ chính xác tuyệt đối. Trả lời bằng tiếng Việt.

QUY TRÌNH XỬ LÝ "SIÊU LOGIC":
1. Bắt đầu bằng thẻ <thinking>: Phân tích kỹ từng từ ngữ trong đoạn văn và đối chiếu với từng phát biểu.
2. PHẢN BIỆN: Tìm mọi lý do để chứng minh phát biểu là Sai. Nếu không có bất kỳ hạt gì, mới kết luận là ĐÚNG. Đừng để bị lừa bởi các từ bẫy ("chỉ", "luôn luôn", "không bao giờ").
3. KẾT LUẬN: Sau khi phân tích xong, ghi dòng chữ "===ANSWER===" và đưa ra chuỗi Đ/S/A/B/C/D cuối cùng.

ĐỊNH DẠNG ĐẤP ÁN:
- Trắc nghiệm: Ghi chữ cái (Ví dụ: A)
- Đúng/Sai: Ghi chuỗi ký tự (Ví dụ: Đ S Đ Đ)

Ví dụ output:
<thinking> Câu 1 nói về A nhưng đoạn văn bảo là B -> Sai. Câu 2... </thinking>
===ANSWER===
S Đ S Đ`;

// --- Vyceai.com (main) ---
const VYCEAI_BASE = 'https://vyceai.com/v1';
const VYCEAI_KEY = process.env.VYCEAI_API_KEY || 'sk-ed1502b80fbe2563e3e6909252a38aa39911e8752e30e196';
const VYCEAI_MODEL = 'deepseek-v4.1';

// --- xKiro.com (first fallback) ---
const XKIRO_BASE = 'https://api.xkiro.com/v1';
const XKIRO_KEYS = [
  process.env.XKIRO_API_KEY || 'sk-xt-6d69f74ba3d4cbdd07e98c0bdaedbdc5c341e2ac859e999f',
  process.env.XKIRO_API_KEY_2 || 'sk-xt-761159ee43b589549f217dd12d6a325f92050df8068435d0',
].filter(Boolean);
const XKIRO_MODEL = 'qwen/qwen3.8-omni-flash:free';

// --- Gemini (second fallback) ---
const GEMINI_KEYS = (process.env.GEMINI_API_KEYS || 'AIzaSyBN_keLh-b6DnTiwV4IP_NoIs5JeQ9UAi4,AIzaSyD7pZOv7-RO2IdY38afJKmbLbsX5mULgGo,AIzaSyDme7JjplDY5XwL7z7G-kGPEqfLK0fEMzI,AIzaSyAjfV6Brj_OSmmxxCSeopbrKl7IlVJyvnU,AIzaSyAGUlSxUcTSvuAf651RBO5UYbgjEk-4ano,AIzaSyArcvNYSfZSJcSmS3ucMcAhGy-PrtPMLGU,AIzaSyDyWAWLcho5AducjM4bJ0_kxd06m1SaanQ,AIzaSyAYLiPIbofRolv73OHB7N-9lpP5RKvAfyw,AIzaSyBTHg-7jfI2B70nP9mo2I12KOjUf5amdvE,AIzaSyDoor7IhE7rCg3nMHauHpnDTYTx23XIIs8,AIzaSyBNqGTlXhBvs6U8w8oRDlRQOoKTNPr51b4,AIzaSyBKBrbdFlcgb6hslbDxhuf6c00dw-K4UHk,AIzaSyCfN_q2Rerd8Bt1lnFCSTpznXXecK8vQIA,AIzaSyCaxXcdEMCZCqmmPRnej-G7PKl8XWNaL3Q,AIzaSyBKIFN4yYsUaFCnExfBnlGC3dXs4OAmX0c,AIzaSyB3ozEa5opf4hLgyGL89qrOupboYySYoT8,AIzaSyCJ-CR-z6JnRCwynYugxT9MwxiebCzQtvw,AIzaSyAP1aCdxRGh_73A2tutboMGKu2CrIzwx7s,AIzaSyCZqjHhGuf59WRvdkbhQHyj3hxnNuV9Mr4,AIzaSyBBPvRcqXiiv-K-dDtkwF9YSsgd0TS6d9g,AIzaSyCFwGCJL5I8VCvrZUhT1h4M7fg80b7dH4A,AIzaSyDLAL4ra3ZLVBWMlOVAacJk6t0800TrGOA,AIzaSyDFOYiVt1a9WKCdn5Lh2SGpixlxCoYzIzs,AIzaSyAHw4tJhNIteV6m1KJ2UyavBtw90ZNH8iA,AIzaSyBezRaVONaAx0OQ5yJIprfqGatwi8YyOAM,AIzaSyDCxpguXtG8yt2pq-64GFBVXgMJETEej64,AIzaSyD3vptTqP5x5daJRNXdfZCz1t8NzPxDLSw,AIzaSyB3Ob7zDObdzAxYjcMirlxc3cP77pQG0S4,AIzaSyAMqJk0GCdhbxheF-RbCCb5QEo-laVXyic').split(',').filter(Boolean);
const GEMINI_MODEL = 'gemini-2.5-flash';

// Round-robin state (in-memory, resets on cold start — OK for free tier)
let xkiroIdx = 0;
let geminiIdx = 0;

function extractAnswer(raw) {
  if (!raw) return null;
  let s = raw.trim();
  const tag = '===ANSWER===';
  const idx = s.indexOf(tag);
  if (idx !== -1) s = s.slice(idx + tag.length).trim();
  return s;
}

async function callOpenAICompat(baseUrl, key, model, text) {
  const res = await fetch(baseUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
      temperature: 0.1,
    }),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'API error');
  return data.choices?.[0]?.message?.content?.trim();
}

// --- Provider 1: Vyceai.com (deepseek-v4.1) ---
async function tryVyceai(text) {
  try {
    const answer = await callOpenAICompat(VYCEAI_BASE, VYCEAI_KEY, VYCEAI_MODEL, text);
    return { answer: extractAnswer(answer), provider: 'vyceai', model: VYCEAI_MODEL };
  } catch (e) {
    return null;
  }
}

// --- Provider 2: xKiro.com (qwen/qwen3.8-omni-flash:free) ---
async function tryXkiro(text) {
  for (let attempt = 0; attempt < XKIRO_KEYS.length; attempt++) {
    const key = XKIRO_KEYS[xkiroIdx % XKIRO_KEYS.length];
    xkiroIdx++;
    try {
      const answer = await callOpenAICompat(XKIRO_BASE, key, XKIRO_MODEL, text);
      return { answer: extractAnswer(answer), provider: 'xkiro', model: XKIRO_MODEL };
    } catch (e) {
      if (e.message === '429') break;
      continue;
    }
  }
  return null;
}

// --- Provider 3: Gemini (gemini-2.5-flash) ---
async function tryGemini(text) {
  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const key = GEMINI_KEYS[geminiIdx % GEMINI_KEYS.length];
    geminiIdx++;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT + '\n\n' + text }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.1 },
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API error');
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (answer) return { answer: extractAnswer(answer), provider: 'gemini', model: GEMINI_MODEL };
    } catch (e) {
      if (e.message === '429' || /429/.test(e.message)) break;
      continue;
    }
  }
  return null;
}

// --- Handler ---
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { text, type } = req.body || {};
  if (!text || text.length < 5) return res.status(400).json({ error: 'Text too short' });

  // Priority: Vyceai > xKiro > Gemini (same order for all question types)
  // deepseek-v4.1 excels at all formats — MCQ, True/False, Word Form, Verb Form
  const result = await tryVyceai(text)
    || await tryXkiro(text)
    || await tryGemini(text);

  if (result) {
    return res.status(200).json(result);
  }
  return res.status(503).json({ error: 'All providers failed' });
};
