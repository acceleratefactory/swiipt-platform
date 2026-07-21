export const STRIP_HTML_BUILD = "v4";
export function stripHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\bimg\s+src="[^"]*"(?:\s+\w+(?:="[^"]*")?)*\s*\/?\s*/gi, "")
    .replace(/\ba\s+href="[^"]*"(?:\s+\w+(?:="[^"]*")?)*\s*/gi, "")
    .replace(/\b(?:br|hr)\s*\/?\s*/gi, "")
    .replace(/(?:^|\s{2,})\/?(?:strong|em|p|ul|ol|li|div|span|table|tr|td|th)\b(?=\s{2,}|$)/gi, "")
    .replace(/\s+\/\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
