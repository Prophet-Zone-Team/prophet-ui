import { toBlob } from "html-to-image";

/** 1x1 transparent PNG used when an embedded image cannot be fetched. */
const SHARE_CARD_IMAGE_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function resolveShareCardRenderOptions(element: HTMLElement) {
  const width = element.offsetWidth;
  const height = element.offsetHeight;

  return {
    width,
    height,
    options: {
      cacheBust: true,
      pixelRatio: 1.4,
      width,
      height,
      canvasWidth: width * 1.4,
      canvasHeight: height * 1.4,
      imagePlaceholder: SHARE_CARD_IMAGE_PLACEHOLDER,
      onImageErrorHandler: () => {
        // html-to-image rejects by default; keep capture going for broken icons.
      },
      style: {
        width: `${width}px`,
        height: `${height}px`,
        margin: "0",
        boxSizing: "border-box",
        overflow: "visible",
      },
      type: "image/png",
    },
  };
}

function normalizeShareCardBlob(blob: Blob): Blob {
  if (blob.type === "image/png") {
    return blob;
  }

  return new Blob([blob], { type: "image/png" });
}

export async function renderShareCardBlob(
  element: HTMLElement,
): Promise<Blob | null> {
  try {
    const { width, height, options } = resolveShareCardRenderOptions(element);

    if (width <= 0 || height <= 0) {
      return null;
    }

    const blob = await toBlob(element, options);

    return blob ? normalizeShareCardBlob(blob) : null;
  } catch {
    return null;
  }
}
