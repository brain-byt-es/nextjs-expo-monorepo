/**
 * Pure-TypeScript Code 128 barcode SVG generator (subset B only).
 * Covers ASCII 32–127, which is sufficient for alphanumeric barcodes.
 * Returns an inline SVG string — no external dependencies required.
 */

// Code 128 B character set: index = value, content = 11-bit bar pattern
// Patterns encode bars as '1' (bar) and '0' (space), each module ~1 unit wide
const CODE128B_PATTERNS: Record<number, string> = {
  0:  "11011001100", 1:  "11001101100", 2:  "11001100110", 3:  "10010011000",
  4:  "10010001100", 5:  "10001001100", 6:  "10011001000", 7:  "10011000100",
  8:  "10001100100", 9:  "11001001000", 10: "11001000100", 11: "11000100100",
  12: "10110011100", 13: "10011011100", 14: "10011001110", 15: "10111001100",
  16: "10011101100", 17: "10011100110", 18: "11001110010", 19: "11001011100",
  20: "11001001110", 21: "11011100100", 22: "11001110100", 23: "11101101110",
  24: "11101001100", 25: "11100101100", 26: "11100100110", 27: "11101100100",
  28: "11100110100", 29: "11100110010", 30: "11011011000", 31: "11011000110",
  32: "11000110110", 33: "10100011000", 34: "10001011000", 35: "10001000110",
  36: "10110001000", 37: "10001101000", 38: "10001100010", 39: "11010001000",
  40: "11000101000", 41: "11000100010", 42: "10110111000", 43: "10110001110",
  44: "10001101110", 45: "10111011000", 46: "10111000110", 47: "10001110110",
  48: "11101110110", 49: "11010001110", 50: "11000101110", 51: "11011101000",
  52: "11011100010", 53: "11011101110", 54: "11101011000", 55: "11101000110",
  56: "11100010110", 57: "11101101000", 58: "11101100010", 59: "11100011010",
  60: "11101111010", 61: "11001000010", 62: "11110001010", 63: "10100110000",
  64: "10100001100", 65: "10010110000", 66: "10010000110", 67: "10000101100",
  68: "10000100110", 69: "10110010000", 70: "10110000100", 71: "10011010000",
  72: "10011000010", 73: "10000110100", 74: "10000110010", 75: "11000010010",
  76: "11001010000", 77: "11110111010", 78: "11000010100", 79: "10001111010",
  80: "10100111100", 81: "10010111100", 82: "10010011110", 83: "10111100100",
  84: "10011110100", 85: "10011110010", 86: "11110100100", 87: "11110010100",
  88: "11110010010", 89: "11011011110", 90: "11011110110", 91: "11110110110",
  92: "10101111000", 93: "10100011110", 94: "10001011110", 95: "10111101000",
  96: "10111100010", 97: "11110101000", 98: "11110100010", 99: "10111011110",
  100: "10111101110", 101: "11101011110", 102: "11110101110",
  // Special: START B (index 104), STOP (index 106), CHECK placeholder
  103: "11010000100",  // START A (unused here but reserved)
  104: "11010010000",  // START B
  105: "11010011110",  // START C (unused)
  106: "11000111010",  // STOP
}

// ASCII offset: Code128B value 0 = ASCII 32 (space)
const ASCII_OFFSET = 32

/**
 * Encode a string as Code 128B and return an SVG string.
 * @param text  The string to encode (ASCII 32–127)
 * @param height  Bar height in pixels (default 60)
 * @param moduleWidth  Width of one module in pixels (default 2)
 */
export function code128Svg(text: string, height = 60, moduleWidth = 2): string {
  // Build array of Code128B values
  const values: number[] = []

  // START B
  values.push(104)

  let checksum = 104

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    if (charCode < 32 || charCode > 127) continue  // skip unsupported chars
    const val = charCode - ASCII_OFFSET
    values.push(val)
    checksum += val * (i + 1)
  }

  // Check character
  values.push(checksum % 103)

  // STOP
  values.push(106)

  // Build bar pattern string from all values
  let barString = ""
  for (const val of values) {
    const pattern = CODE128B_PATTERNS[val]
    if (pattern) barString += pattern
  }
  // Add final bar (STOP termination bar)
  barString += "11"

  // Build SVG rects
  const totalWidth = barString.length * moduleWidth
  const rects: string[] = []
  let x = 0
  let i = 0

  while (i < barString.length) {
    const bit = barString[i]
    let runLength = 1
    while (i + runLength < barString.length && barString[i + runLength] === bit) {
      runLength++
    }
    if (bit === "1") {
      rects.push(`<rect x="${x}" y="0" width="${runLength * moduleWidth}" height="${height}" fill="black"/>`)
    }
    x += runLength * moduleWidth
    i += runLength
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="Barcode: ${text}">`,
    `<rect width="${totalWidth}" height="${height}" fill="white"/>`,
    ...rects,
    `</svg>`,
  ].join("")
}
