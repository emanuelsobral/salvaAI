// Parses model JSON. The only recovery is escaping raw control characters
// (U+0000-U+001F) inside string literals, which JSON forbids but whose meaning
// is unambiguous. Structure is never repaired: missing or extra brackets,
// truncation and unbalanced quotes still throw. Callers must validate the result.
export function parseModelJson(text) {
  try { return { data: JSON.parse(text), recovered: false }; }
  catch (error) {
    let inString = false, escaped = false, changed = false, out = '';
    for (const char of text) {
      const code = char.charCodeAt(0);
      if (inString && !escaped && code < 0x20) {
        out += char === '\n' ? '\\n' : char === '\r' ? '\\r' : char === '\t' ? '\\t' : '\\u' + code.toString(16).padStart(4, '0');
        changed = true;
        continue;
      }
      out += char;
      if (escaped) escaped = false;
      else if (inString && char === '\\') escaped = true;
      else if (char === '"') inString = !inString;
    }
    if (!changed || inString) throw error;
    return { data: JSON.parse(out), recovered: true };
  }
}

