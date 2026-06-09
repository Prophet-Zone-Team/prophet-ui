let lastFiredAt = 0;
const COOLDOWN_MS = 800;
const EMOJI_SCALAR = 2;

export async function fireBasicConfettiFromElement(element?: HTMLElement | null) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastFiredAt < COOLDOWN_MS) return;
  lastFiredAt = now;

  const { default: confetti } = await import("canvas-confetti");
  const origin = element
    ? (() => {
        const rect = element.getBoundingClientRect();
        return {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight
        };
      })()
    : { x: 0.5, y: 0.5 };
  const trophy = confetti.shapeFromText({ text: "🏆", scalar: EMOJI_SCALAR });

  void confetti({
    shapes: [trophy],
    scalar: EMOJI_SCALAR,
    origin,
    disableForReducedMotion: true
  });
}
