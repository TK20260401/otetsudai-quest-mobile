import type { Palette } from "./palettes";

/**
 * カラー値を輝度保持グレースケールに変換
 * 対応フォーマット: #rgb / #rrggbb / rgba(r,g,b,a)
 * 輝度式: ITU-R BT.601 (0.299R + 0.587G + 0.114B)
 */
export function toGrayscale(color: string): string {
  if (!color) return color;
  const trimmed = color.trim();

  // rgba(r, g, b, a) 形式
  if (trimmed.startsWith("rgba") || trimmed.startsWith("rgb")) {
    const nums = trimmed.match(/[\d.]+/g);
    if (!nums || nums.length < 3) return color;
    const r = parseFloat(nums[0]);
    const g = parseFloat(nums[1]);
    const b = parseFloat(nums[2]);
    const a = nums[3] != null ? parseFloat(nums[3]) : 1;
    const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    return a === 1 ? `rgb(${y}, ${y}, ${y})` : `rgba(${y}, ${y}, ${y}, ${a})`;
  }

  // #rgb / #rrggbb 形式
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    let r: number, g: number, b: number;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return color;
    }
    const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const hh = y.toString(16).padStart(2, "0");
    return `#${hh}${hh}${hh}`;
  }

  return color;
}

/** Palette の全色キーをグレースケール化 */
export function toGrayscalePalette(palette: Palette): Palette {
  const out = { ...palette };
  (Object.keys(out) as Array<keyof Palette>).forEach((k) => {
    const v = out[k];
    if (typeof v === "string" && (v.startsWith("#") || v.startsWith("rgb"))) {
      (out as any)[k] = toGrayscale(v);
    }
  });
  return out;
}
