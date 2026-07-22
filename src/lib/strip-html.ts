export const STRIP_HTML_BUILD = "v8";

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&bull;/g, "\u2022")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&[a-zA-Z]+;/g, "");
}

export function cleanDescription(text: string, maxLength = 3000): string {
  return text
    .replace(/#\w+/g, "")
    .replace(/@\w+/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function stripHtml(text: string): string {
  return decodeEntities(text)
    .replace(/<[^>]*>/g, "")
    .replace(/\bimg\s+src="[^"]*"(?:\s+\w+(?:="[^"]*")?)*\s*\/?\s*/gi, "")
    .replace(/\ba\s+href="[^"]*"(?:\s+\w+(?:="[^"]*")?)*\s*/gi, "")
    .replace(/\b(?:br|hr)\s*\/?\s*/gi, "")
    .replace(/(?:^|\s{2,})\/?(?:strong|em|p|ul|ol|li|div|span|table|tr|td|th)\b(?=\s{2,}|$)/gi, "")
    .replace(/\s+\/\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
