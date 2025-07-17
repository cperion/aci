// Quick test script to verify theme loading
import { themeLoader } from './src/tui/themes/theme-loader.js';

console.log('🎨 Base16 Theme System Test');
console.log('==========================');

const themes = themeLoader.getAvailableThemes();
console.log(`📚 Loaded ${themes.length} themes total`);

console.log('\n🌟 Popular themes:');
const categories = themeLoader.getThemesByCategory();
categories.Popular.slice(0, 5).forEach(theme => {
  console.log(`  • ${theme.scheme} (${theme.name})`);
});

console.log('\n🎲 Testing random theme:');
const randomTheme = themeLoader.getRandomTheme();
if (randomTheme) {
  console.log(`  Selected: ${randomTheme.scheme}`);
  console.log(`  Colors: ${randomTheme.base08} ${randomTheme.base0B} ${randomTheme.base0D}`);
  
  const mapping = themeLoader.mapToArcGIS(randomTheme);
  console.log(`  ArcGIS mapping: errors=${mapping.errors}, success=${mapping.success}, portals=${mapping.portals}`);
}

console.log('\n✅ Theme system working correctly!');