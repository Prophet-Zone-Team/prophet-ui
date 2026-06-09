export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    input.remove();
    return ok;
  }
}

export function downloadResultPoster(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = "900px";
  clone.style.minHeight = "520px";

  const styles = Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent)
    .join("\n");
  const html = `<div xmlns="http://www.w3.org/1999/xhtml"><style>${styles} body{margin:0;background:#f6f4ef}</style>${clone.outerHTML}</div>`;
  const width = 940;
  const height = 620;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${html.replace(/#/g, "%23")}</foreignObject></svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "world-cup-champion-route.svg";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
