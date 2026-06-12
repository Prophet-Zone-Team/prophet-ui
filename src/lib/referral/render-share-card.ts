import { toBlob } from "html-to-image";

function resolveShareCardRenderOptions(element: HTMLElement) {
  const width = element.offsetWidth;
  const height = element.offsetHeight;

  return {
    width,
    height,
    options: {
      cacheBust: true,
      pixelRatio: 2,
      width,
      height,
      canvasWidth: width * 2,
      canvasHeight: height * 2,
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
