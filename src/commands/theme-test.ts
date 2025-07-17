import { startTui } from '../tui/app.js';

export async function themeTest() {
  console.log('🎨 Starting ArcGIS CLI with Base16 Theme System');
  console.log('Commands:');
  console.log('  [ ] - Previous/Next theme');
  console.log('  r   - Random theme');
  console.log('  Ctrl+C - Exit');
  console.log('');
  
  await startTui();
}

if (import.meta.main) {
  themeTest();
}