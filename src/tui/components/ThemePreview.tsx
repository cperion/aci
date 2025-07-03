import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../themes/theme-manager.js';

export function ThemePreview() {
  const { current, colors, name } = useTheme();

  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="round" borderColor={colors.highlights} padding={1}>
        <Box flexDirection="column" gap={1}>
          <Text bold color={colors.highlights}>
            {current.scheme} ({name})
          </Text>
          <Text color={colors.metadata}>
            by {current.author}
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column" gap={1}>
        <Text bold color={colors.labels}>Base16 Color Palette:</Text>
        
        {/* Background Colors (Geological Strata) */}
        <Box flexDirection="column">
          <Text color={colors.metadata}>Background Layers:</Text>
          <Box gap={1}>
            <Text color={colors.mainBackground}>████</Text>
            <Text color={colors.primaryText}>Main Background</Text>
          </Box>
          <Box gap={1}>
            <Text color={colors.panelBackground}>████</Text>
            <Text color={colors.primaryText}>Panel Background</Text>
          </Box>
          <Box gap={1}>
            <Text color={colors.workspaceBackground}>████</Text>
            <Text color={colors.primaryText}>Workspace Background</Text>
          </Box>
        </Box>

        {/* Text Colors (Organic Materials) */}
        <Box flexDirection="column">
          <Text color={colors.metadata}>Text Hierarchy:</Text>
          <Text color={colors.metadata}>◦ Metadata (twilight dusk)</Text>
          <Text color={colors.labels}>◦ Labels (fossilized amber)</Text>
          <Text color={colors.primaryText}>◦ Primary Text (moonlit birch)</Text>
          <Text color={colors.highlights}>◦ Highlights (sun pillar)</Text>
        </Box>

        {/* Semantic Colors (Atmospheric Phenomena) */}
        <Box flexDirection="column">
          <Text color={colors.metadata}>ArcGIS Elements:</Text>
          <Text color={colors.errors}>◦ Errors (caldera eruption)</Text>
          <Text color={colors.warnings}>◦ Warnings (desert canyon)</Text>
          <Text color={colors.servers}>◦ Servers (harvested wheat)</Text>
          <Text color={colors.success}>◦ Success (permafrost moss)</Text>
          <Text color={colors.features}>◦ Features (fjord springs)</Text>
          <Text color={colors.portals}>◦ Portals (stratospheric ice)</Text>
          <Text color={colors.users}>◦ Users (midnight bloom)</Text>
          <Text color={colors.selections}>◦ Selections (magnetospheric flare)</Text>
        </Box>
      </Box>

      <Box borderStyle="single" borderColor={colors.separators} padding={1}>
        <Text color={colors.metadata}>
          Press [ and ] to cycle themes • Press r for random theme
        </Text>
      </Box>
    </Box>
  );
}

export function ColorSwatch({ 
  color, 
  label, 
  description 
}: { 
  color: string; 
  label: string; 
  description?: string;
}) {
  return (
    <Box gap={1}>
      <Text color={color}>███</Text>
      <Box flexDirection="column">
        <Text color={color} bold>{label}</Text>
        {description && <Text dimColor>{description}</Text>}
      </Box>
    </Box>
  );
}