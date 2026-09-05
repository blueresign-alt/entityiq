/** Isomorphic integrity token. SHA-256 can replace this on a Node-only evidence exporter. */
export function evidenceHash(input: string): string {
  let h1 = 2166136261;
  let h2 = 5381;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619);
    h2 = (h2 * 33) ^ c;
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

export function newId(prefix: string): string {
  const n = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36).slice(-4);
  return `${prefix}_${t}${n}`;
}
