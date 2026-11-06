// Tiny original 3x5 bitmap alphabet, so contact labels need no native fonts.
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-=/%: ';
const glyphs = [
  '010101111101101','110101110101110','011100100100011','110101101101110','111100110100111',
  '111100110100100','011100101101011','101101111101101','111010010010111','001001001101010',
  '101101110101101','100100100100111','101111111101101','101111111111101','010101101101010',
  '110101110100100','010101101111011','110101110101101','011100010001110','111010010010010',
  '101101101101111','101101101101010','101101111111101','101101010101101','101101010010010',
  '111001010100111','111101101101111','010110010010111','110001010100111','110001010001110',
  '101101111001001','111100110001110','011100110101010','111001010010010','010101010101010',
  '010101011001110','000000000000010','000000111000000','000111000111000','001001010100100',
  '101001010100101','000010000010000','000000000000000',
];
export function setPixel(frame, x, y, rgba) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= frame.w || y >= frame.h) return;
  const i = (y * frame.w + x) * 4, a = rgba[3] / 255;
  for (let c = 0; c < 3; c++) frame.data[i + c] = frame.data[i + c] * (1 - a) + rgba[c] * a;
  frame.data[i + 3] = 255;
}
export function drawText(frame, text, x, y, color, scale = 2) {
  for (const char of text.toUpperCase()) {
    const glyph = glyphs[alphabet.indexOf(char)] ?? glyphs.at(-1);
    for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < 3; gx++) {
      if (glyph[gy * 3 + gx] !== '1') continue;
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) setPixel(frame, x + gx * scale + sx, y + gy * scale + sy, color);
    }
    x += 4 * scale;
  }
}
export function line(frame, x0, y0, x1, y1, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) setPixel(frame, x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps, color);
}
export function rect(frame, x, y, w, h, color) {
  line(frame, x, y, x + w - 1, y, color); line(frame, x, y + h - 1, x + w - 1, y + h - 1, color);
  line(frame, x, y, x, y + h - 1, color); line(frame, x + w - 1, y, x + w - 1, y + h - 1, color);
}
