function isCrossOriginHttpImageSrc(src: string): boolean {
  if (!src.startsWith("http://") && !src.startsWith("https://")) {
    return false;
  }

  if (typeof window === "undefined") {
    return true;
  }

  try {
    return new URL(src).origin !== window.location.origin;
  } catch {
    return false;
  }
}

async function fetchImageDataUrlViaProxy(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(
      `/api/share/image-proxy?url=${encodeURIComponent(url)}`,
    );

    if (!response.ok) {
      return undefined;
    }

    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

/**
 * Replaces cross-origin <img> sources with same-origin data URLs so html-to-image
 * can paint them without CORS headers from upstream CDNs.
 */
export async function inlineExternalImagesForCapture(
  root: HTMLElement,
): Promise<() => void> {
  const images = Array.from(root.querySelectorAll("img"));
  const restores: Array<() => void> = [];

  await Promise.all(
    images.map(async (image) => {
      const src = image.currentSrc || image.src;

      if (!src || src.startsWith("data:") || !isCrossOriginHttpImageSrc(src)) {
        return;
      }

      const dataUrl = await fetchImageDataUrlViaProxy(src);

      if (!dataUrl) {
        return;
      }

      const originalSrc = image.src;
      const originalSrcset = image.srcset;

      image.src = dataUrl;
      image.removeAttribute("srcset");
      image.removeAttribute("crossorigin");

      restores.push(() => {
        image.src = originalSrc;

        if (originalSrcset) {
          image.srcset = originalSrcset;
        }
      });
    }),
  );

  return () => {
    for (const restore of restores.reverse()) {
      restore();
    }
  };
}
