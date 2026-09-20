// ==UserScript==
// @name         AI Helper V16 (Direct API + GPT-4o-mini)
// @namespace    ai-helper
// @version      16.0
// @description  Stealth button. Priority: OpenAI (gpt-4o-mini) > Gemini (gemini-3.8-flash) > xKiro (qwen3.8-omni)
// @match        *://*/*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ================== API KEYS (direct connect) ==================
  const OPENAI_KEY = 'sk-ed1502b80fbe2563e3e6909252a38aa39911e8752e30e196';
  const OPENAI_BASE = 'https://api.openai.com/v1';
  const OPENAI_MODEL = 'gpt-4o-mini';

  const XKIRO_KEYS = [
    'sk-xt-6d69f74ba3d4cbdd07e98c0bdaedbdc5c341e2ac859e999f',
    'sk-xt-761159ee43b589549f217dd12d6a325f92050df8068435d0',
  ];
  const XKIRO_BASE = 'https://api.xkiro.com/v1';
  const XKIRO_MODEL = 'qwen/qwen3.8-omni-flash:free';

  const GEMINI_KEYS = [
    'AIzaSyBN_keLh-b6DnTiwV4IP_NoIs5JeQ9UAi4',
    'AIzaSyD7pZOv7-RO2IdY38afJKmbLbsX5mULgGo',
    'AIzaSyDme7JjplDY5XwL7z7G-kGPEqfLK0fEMzI',
    'AIzaSyAjfV6Brj_OSmmxxCSeopbrKl7IlVJyvnU',
    'AIzaSyAGUlSxUcTSvuAf651RBO5UYbgjEk-4ano',
    'AIzaSyArcvNYSfZSJcSmS3ucMcAhGy-PrtPMLGU',
    'AIzaSyDyWAWLcho5AducjM4bJ0_kxd06m1SaanQ',
    'AIzaSyAYLiPIbofRolv73OHB7N-9lpP5RKvAfyw',
    'AIzaSyBTHg-7jfI2B70nP9mo2I12KOjUf5amdvE',
    'AIzaSyDoor7IhE7rCg3nMHauHpnDTYTx23XIIs8',
    'AIzaSyBNqGTlXhBvs6U8w8oRDlRQOoKTNPr51b4',
    'AIzaSyBKBrbdFlcgb6hslbDxhuf6c00dw-K4UHk',
    'AIzaSyCfN_q2Rerd8Bt1lnFCSTpznXXecK8vQIA',
    'AIzaSyCaxXcdEMCZCqmmPRnej-G7PKl8XWNaL3Q',
    'AIzaSyBKIFN4yYsUaFCnExfBnlGC3dXs4OAmX0c',
    'AIzaSyB3ozEa5opf4hLgyGL89qrOupboYySYoT8',
    'AIzaSyCJ-CR-z6JnRCwynYugxT9MwxiebCzQtvw',
    'AIzaSyAP1aCdxRGh_73A2tutboMGKu2CrIzwx7s',
    'AIzaSyCZqjHhGuf59WRvdkbhQHyj3hxnNuV9Mr4',
    'AIzaSyBBPvRcqXiiv-K-dDtkwF9YSsgd0TS6d9g',
    'AIzaSyCFwGCJL5I8VCvrZUhT1h4M7fg80b7dH4A',
    'AIzaSyDLAL4ra3ZLVBWMlOVAacJk6t0800TrGOA',
    'AIzaSyDFOYiVt1a9WKCdn5Lh2SGpixlxCoYzIzs',
    'AIzaSyAHw4tJhNIteV6m1KJ2UyavBtw90ZNH8iA',
    'AIzaSyBezRaVONaAx0OQ5yJIprfqGatwi8YyOAM',
    'AIzaSyDCxpguXtG8yt2pq-64GFBVXgMJETEej64',
    'AIzaSyD3vptTqP5x5daJRNXdfZCz1t8NzPxDLSw',
    'AIzaSyB3Ob7zDObdzAxYjcMirlxc3cP77pQG0S4',
    'AIzaSyAMqJk0GCdhbxheF-RbCCb5QEo-laVXyic',
  ];
  const GEMINI_MODEL = 'gemini-3.8-flash';

  const PROMPT = "Bạn là Chuyên gia giải đề thi Quốc gia. Trả lời bằng tiếng Việt.\nQUY TRÌNH: Phân tích logic, tìm mọi lý do để chứng minh phát biểu Sai.\nKết quả: Ghi ===ANSWER=== và chuỗi Đ/S/A/B/C/D.\nĐỊNH DẠNG: MCQ=A, Đ/S=Đ S, Word Form=từ, Verb form=động từ. Không giải thích.";

  // ================= ROOT =================
  const host = document.createElement('div');
  host.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'closed' });

  // ================= PANEL =================
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed;
    bottom: 70px;
    right: 12px;
    width: 240px;
    max-height: 220px;
    background: rgba(255,255,255,0.95);
    color: #222;
    font: 13px/1.4 system-ui,-apple-system,sans-serif;
    border-radius: 12px;
    padding: 10px 12px;
    overflow-y: auto;
    display: none;
    pointer-events: none;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    word-break: break-word;
    white-space: pre-wrap;
    -webkit-overflow-scrolling: touch;
  `;
  shadow.appendChild(panel);

  // ================= BUTTON =================
  const btn = document.createElement('div');
  btn.textContent = 'GPT-4o-mini';
  btn.style.cssText = `
    position: fixed;
    bottom: 18px;
    right: 18px;
    width: 60px;
    height: 60px;
    background: rgba(255,255,255,0.6);
    color: rgba(0,0,0,0.35);
    font: 700 14px system-ui;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
    border: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    transition: opacity 0.2s;
    text-align: center;
    line-height: 1.2;
  `;
  shadow.appendChild(btn);

  // ================= UI =================
  function show(text, timeout) {
    panel.textContent = text;
    panel.style.display = visible ? 'block' : 'none';
    if (timeout) {
      setTimeout(() => {
        if (panel.textContent === text) panel.style.display = 'none';
      }, timeout);
    }
  }

  // ================= SELECTION =================
  let selectedText = '';
  let visible = true;

  document.addEventListener('selectionchange', () => {
    try { selectedText = window.getSelection().toString().trim(); } catch {}
  }, { passive: true });

  // ================= DETECT QUESTION TYPE =================
  function isMCQ(text) {
    return /A[\.\)]\s/i.test(text) && /B[\.\)]\s/i.test(text);
  }
  function countMCQ(text) {
    var groups = text.split(/(?=A[\.\)]\s)/i);
    var count = 0;
    for (var i = 0; i < groups.length; i++) {
      if (/A[\.\)]\s.*B[\.\)]\s.*C[\.\)]\s/is.test(groups[i])) count++;
    }
    return Math.max(count, 1);
  }
  function isWordform(text) {
    if (/\([\w\s]+\)|\[[\w\s]+\]/i.test(text) && (text.includes('___') || text.includes('...'))) return true;
    if (/(dạng đúng|chia động từ|word form|correct form|bracket)/i.test(text)) return true;
    return false;
  }
  function isTrueFalse(text) {
    if (isMCQ(text)) return false;
    if (/đúng\s*(hay|hoặc|\/)\s*sai|đúng.*sai|true.*false|T\s*\/\s*F|✓.*✗|☑|☐/i.test(text)) return true;
    if (/(xác|nhận|phát biểu|câu).*(đúng|sai)/i.test(text)) return true;
    var markers = text.match(/^\s*([\d]+[\.\.\)]\s|[a-d][\.\.\)]\s|-\s|•\s|[✓✗]\s)/gmi);
    if (markers && markers.length >= 2) return true;
    if (text.includes('Câu trả lời của bạn:')) {
      var parts = text.split('Câu trả lời của bạn:');
      if (parts[1] && parts[1].trim().split('\n').filter(l => l.length > 15).length >= 2) return true;
    }
    return false;
  }
  function countStatements(text) {
    var m = text.match(/^\s*([\d]+[\.\.\)]\s|[a-d][\.\.\)]\s|-\s|•\s)/gmi);
    if (m && m.length >= 2) return m.length;
    var lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20);
    if (lines.length > 4) return 4;
    return Math.max(lines.length, 1);
  }
  function cleanMCQ(ans, count) {
    if (count <= 1) {
      var m = ans.match(/\b([ABCD])\b/i);
      return m ? m[1].toUpperCase() : ans.trim().substring(0, 30);
    }
    return ans.trim().substring(0, 100);
  }
  function cleanTF(ans) {
    var clean = ans.trim();
    clean = clean.replace(/\bđúng\b/gi, 'Đ').replace(/\bsai\b/gi, 'S');
    clean = clean.replace(/\btrue\b/gi, 'Đ').replace(/\bfalse\b/gi, 'S');
    clean = clean.replace(/\bcorrect\b/gi, 'Đ').replace(/\bincorrect\b|\bwrong\b/gi, 'S');
    return clean;
  }
  function buildPrompt(text) {
    if (isMCQ(text)) {
      var mcqCount = countMCQ(text);
      if (mcqCount > 1) {
        return { type: 'mcq', count: mcqCount, prompt: `Có ${mcqCount} câu trắc nghiệm. Với MỖI câu, chọn 1 đáp án A/B/C/D.\nVí dụ: B D D B\n\n${text}` };
      }
      return { type: 'mcq', count: 1, prompt: `LUẬT: Chỉ trả lời 1 ký tự A/B/C/D. KHÔNG giải thích.\n\n${text}` };
    }
    if (isWordform(text)) {
      return { type: 'mcq', count: 1, prompt: `Đây là bài tập Word Form hoặc chia động từ. Hãy đưa ra đáp án đúng nhất.\nKHÔNG giải thích.\n\n${text}` };
    }
    if (isTrueFalse(text)) {
      var n = countStatements(text);
      return { type: 'tf', count: n, prompt: `PHÂN TÍCH LOGIC CỰC KỲ CẨN THẬN. Đọc đoạn văn và xác định ${n} phát biểu là ĐÚNG hay SAI.\nLƯU Ý: Cảnh giác với các bẫy trạng từ (chỉ, luôn luôn, duy nhất) và bẫy tráo đổi chủ ngữ.\nTrả lời: Đ S Đ S\nKHÔNG giải thích.\n\n${text}` };
    }
    return { type: 'other', count: 0, prompt: text };
  }

  // ================= PROVIDER FUNCTIONS =================
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

  async function callGemini(key, model, text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
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
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  }

  let xkiroIdx = 0;
  let geminiIdx = 0;

  async function tryOpenAI(text) {
    try {
      const answer = await callOpenAICompat(OPENAI_BASE, OPENAI_KEY, OPENAI_MODEL, text);
      return { answer: extractAnswer(answer), provider: 'openai', model: OPENAI_MODEL };
    } catch (e) {
      return null;
    }
  }

  async function tryXkiro(text) {
    for (let attempt = 0; attempt < XKIRO_KEYS.length; attempt++) {
      const key = XKIRO_KEYS[xkiroIdx % XKIRO_KEYS.length];
      xkiroIdx++;
      try {
        const answer = await callOpenAICompat(XKIRO_BASE, key, XKIRO_MODEL, text);
        return { answer: extractAnswer(answer), provider: 'xkiro', model: XKIRO_MODEL };
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  async function tryGemini(text) {
    for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
      const key = GEMINI_KEYS[geminiIdx % GEMINI_KEYS.length];
      geminiIdx++;
      try {
        const answer = await callGemini(key, GEMINI_MODEL, text);
        if (answer) return { answer: extractAnswer(answer), provider: 'gemini', model: GEMINI_MODEL };
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  // Priority: OpenAI > Gemini > xKiro
  async function askProvider(text) {
    let result = await tryOpenAI(text);
    if (!result) result = await tryGemini(text);
    if (!result) result = await tryXkiro(text);
    return result;
  }

  // ================= ASK =================
  function ask(text) {
    if (!text || text.length < 5) {
      show('⚠️ Chọn nội dung trước', 2000);
      return;
    }

    const { type, prompt, count } = buildPrompt(text);

    let label = '⏳';
    if (type === 'mcq') label = count > 1 ? `⏳ [${count} câu ABCD]` : '⏳ [ABCD]';
    else if (type === 'tf') label = `⏳ [${count} câu Đ/S]`;
    show(label + '...');

    askProvider(prompt)
    .then(d => {
      if (!d) { show('❌ All providers failed', 3000); return; }

      let ans = d.answer;
      if (ans.includes('===ANSWER===')) {
        ans = ans.split('===ANSWER===')[1].trim();
      }

      let icon = '🤖';
      if (type === 'mcq') {
        ans = cleanMCQ(ans, count);
        icon = '👉';
      } else if (type === 'tf') {
        ans = cleanTF(ans);
        icon = '📝';
      }

      btn.textContent = d.model;

      const tag = '\n[' + d.model + ']';
      show(icon + ' ' + ans + tag, 12000);
    })
    .catch(() => {
      show('❌ Error', 3000);
    });
  }

  // ================= TAP EVENTS =================
  let ltap = 0;

  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - ltap < 300) {
      visible = !visible;
      panel.style.display = (visible && panel.textContent) ? 'block' : 'none';
      ltap = 0;
      return;
    }
    ltap = now;
    setTimeout(() => {
      if (ltap === 0) return;
      if (selectedText && selectedText.length >= 5) ask(selectedText);
      else show('👆 Bôi đen câu hỏi', 2000);
    }, 310);
  }, { passive: false });

  btn.addEventListener('click', () => {
    if ('ontouchend' in window) return;
    if (selectedText && selectedText.length >= 5) ask(selectedText);
    else show('👆 Bôi đen câu hỏi', 2000);
  });

  btn.addEventListener('dblclick', () => {
    if ('ontouchend' in window) return;
    visible = !visible;
    panel.style.display = (visible && panel.textContent) ? 'block' : 'none';
  });

  // ================= INIT: check connection =================
  async function initCheck() {
    const result = await askProvider('test: 1+1');
    if (result && result.model) {
      btn.textContent = result.model;
      btn.style.color = '#000';
    } else {
      btn.textContent = '❌ Offline';
      btn.style.color = '#ff4444';
      show('❌ All providers offline', 3000);
    }
  }

  initCheck();

})();
