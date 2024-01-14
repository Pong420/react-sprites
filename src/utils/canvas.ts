/**
 * References:
 * https://web.dev/articles/canvas-imagefilters
 * https://stackoverflow.com/questions/25092391/how-to-dim-an-image-keeping-transparency-untouched-with-css-or-js
 */

export function getPixels(context: CanvasRenderingContext2D, { x = 0, y = 0, width = 0, height = 0 } = {}) {
  return context.getImageData(x, y, width, height);
}

export function grayscale(...[context, bounds]: Parameters<typeof getPixels>) {
  const pixels = getPixels(context, { x: 0, y: 0, width: bounds?.width, height: bounds?.height });
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    // CIE luminance for the RGB
    // The human eye is bad at seeing red and blue, so we de-emphasize them.
    const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  context.putImageData(pixels, 0, 0);
}

export function brightness(brightness: number) {
  return (...[context, bounds]: Parameters<typeof getPixels>) => {
    const pixels = getPixels(context, { x: 0, y: 0, width: bounds?.width, height: bounds?.height });
    const d = pixels.data;
    for (let i = 0; i <= d.length; i += 4) {
      d[i] = brightness * d[i];
      d[i + 1] = brightness * d[i + 1];
      d[i + 2] = brightness * d[i + 2];
    }
    context.putImageData(pixels, 0, 0);
  };
}
