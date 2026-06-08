export function shareToX(text: string, link?: string, options?: { isOpenOutside?: boolean; hashtags?: string; }) {
  const { isOpenOutside, hashtags } = options ?? {};

  let xPath = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  
  if (link) {
    xPath += `&url=${encodeURIComponent(link)}`;
  }

  if (hashtags) {
    xPath += `&hashtags=${encodeURIComponent(hashtags)}`;
  }
  
  if (isOpenOutside) {
    return xPath;
  }
  window.open(xPath);
}
