/**
 * A service to capture website screenshots.
 * For V1, we use a public free-tier API (like ApiFlash or Microlink) 
 * or fallback to a placeholder if no URL is provided.
 */
export async function getScreenshotUrl(websiteUrl?: string): Promise<string | undefined> {
  if (!websiteUrl) return undefined;
  
  // Clean URL
  let url = websiteUrl;
  if (!url.startsWith("http")) url = "https://" + url;

  // Using microlink api as a reliable fallback for screenshots
  // Note: For production, this should use a paid key to avoid rate limits.
  const encodedUrl = encodeURIComponent(url);
  return `https://api.microlink.io/?url=${encodedUrl}&screenshot=true&meta=false&embed=screenshot.url`;
}
