/**
 * Color utility functions for contrast enhancement and accessibility
 * Based on WCAG 2.1 guidelines and W3C color algorithms
 */

export const MIN_CONTRAST_RATIO = 4.5; // WCAG AA standard
export const ENHANCED_CONTRAST_RATIO = 7.0; // WCAG AAA standard

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Convert RGB to relative luminance
 * Based on WCAG 2.1 formula
 */
function rgbToLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculate relative luminance from hex color
 */
export function calculateLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return rgbToLuminance(r, g, b);
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert RGB back to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust color luminance to meet contrast requirements
 */
export function adjustColorForContrast(
  foreground: string, 
  background: string, 
  targetRatio: number = MIN_CONTRAST_RATIO
): string {
  const bgLuminance = calculateLuminance(background);
  const [fgR, fgG, fgB] = hexToRgb(foreground);
  
  // Determine if we need to make foreground lighter or darker
  const currentRatio = calculateContrastRatio(foreground, background);
  
  if (currentRatio >= targetRatio) {
    return foreground; // Already meets requirements
  }
  
  // Calculate target luminance
  const targetLuminance = bgLuminance > 0.5 
    ? (bgLuminance + 0.05) / targetRatio - 0.05  // Make darker
    : (bgLuminance + 0.05) * targetRatio - 0.05; // Make lighter
    
  // Binary search for the right adjustment
  let adjustmentFactor = bgLuminance > 0.5 ? -1 : 1;
  let step = 0.5;
  let bestColor = foreground;
  let bestRatio = currentRatio;
  
  for (let i = 0; i < 10; i++) { // Limit iterations
    const adjustment = adjustmentFactor * step * 255;
    const newR = Math.max(0, Math.min(255, fgR + adjustment));
    const newG = Math.max(0, Math.min(255, fgG + adjustment));
    const newB = Math.max(0, Math.min(255, fgB + adjustment));
    
    const newColor = rgbToHex(newR, newG, newB);
    const newRatio = calculateContrastRatio(newColor, background);
    
    if (newRatio >= targetRatio && newRatio > bestRatio) {
      bestColor = newColor;
      bestRatio = newRatio;
    }
    
    if (newRatio >= targetRatio) break;
    
    step *= 0.7; // Reduce step size
  }
  
  return bestColor;
}

/**
 * Check if a color pair meets WCAG accessibility standards
 */
export function isAccessible(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const threshold = level === 'AAA' ? ENHANCED_CONTRAST_RATIO : MIN_CONTRAST_RATIO;
  return ratio >= threshold;
}

/**
 * Get contrast assessment for debugging
 */
export function getContrastAssessment(foreground: string, background: string): {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  recommendation: string;
} {
  const ratio = calculateContrastRatio(foreground, background);
  const meetsAA = ratio >= MIN_CONTRAST_RATIO;
  const meetsAAA = ratio >= ENHANCED_CONTRAST_RATIO;
  
  let recommendation = '';
  if (!meetsAA) {
    recommendation = 'Insufficient contrast - requires adjustment';
  } else if (!meetsAAA) {
    recommendation = 'Meets AA standard - consider AAA for enhanced accessibility';
  } else {
    recommendation = 'Excellent contrast - meets AAA standard';
  }
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    meetsAA,
    meetsAAA,
    recommendation
  };
}

/**
 * Validate all color pairs in a theme mapping
 */
export function validateThemeContrast(colors: Record<string, string>): Array<{
  pair: [string, string];
  assessment: ReturnType<typeof getContrastAssessment>;
}> {
  const results = [];
  
  // Critical pairs that need validation
  const criticalPairs: Array<[string, string]> = [
    ['primaryText', 'mainBackground'],
    ['labels', 'panelBackground'],
    ['metadata', 'panelBackground'],
    ['highlights', 'mainBackground'],
    ['errors', 'mainBackground'],
    ['warnings', 'mainBackground'],
    ['success', 'mainBackground']
  ];
  
  for (const [fg, bg] of criticalPairs) {
    if (colors[fg] && colors[bg]) {
      results.push({
        pair: [fg, bg] as [string, string],
        assessment: getContrastAssessment(colors[fg], colors[bg])
      });
    }
  }
  
  return results;
}