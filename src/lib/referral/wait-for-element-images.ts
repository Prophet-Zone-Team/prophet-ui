/**
 * Resolves when all <img> descendants inside `root` have finished loading or failed.
 * Used before html-to-image capture so external assets are painted into the canvas.
 */
export function waitForElementImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));

  if (images.length === 0) {
    return Promise.resolve();
  }

  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
          }

          const finish = () => resolve();
          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
        }),
    ),
  ).then(() => undefined);
}
