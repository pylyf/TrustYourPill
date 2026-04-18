export function createExcerpt(text: string, maxLength = 240) {
  return text.slice(0, maxLength).trim();
}
