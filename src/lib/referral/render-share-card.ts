import { toBlob } from "html-to-image";

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
      style: {
        width: `${width}px`,
        height: `${height}px`,
        margin: "0",
        boxSizing: "border-box",
        overflow: "visible",
      },
    },
  };
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

    return blob ?? null;
  } catch {
    return null;
  }
}
