const SHARE_IMAGE_RETRY_DELAYS_MS = [0, 400, 800, 1500, 3000, 5000, 6000, 7000, 8000, 9000, 10000] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function loadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
    };

    image.onerror = () => {
      resolve(false);
    };

    image.src = url;
  });
}

/** Wait until a freshly uploaded share image is reachable by the browser. */
export async function waitForShareImageReady(url: string): Promise<boolean> {
  if (!url.trim()) {
    return false;
  }

  for (const delayMs of SHARE_IMAGE_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await sleep(delayMs);
    }

    const loaded = await loadImage(url);
    if (loaded) {
      return true;
    }
  }

  return false;
}
