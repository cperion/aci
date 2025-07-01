#!/usr/bin/env node

import { Command } from 'commander';
import { registerCommands } from './commands/register.js';

const program = new Command();

program
  .name('aci')
  .description('ArcGIS Command Line Interface for enterprise workflows')
  .version('0.1.0');

// Register all commands
registerCommands(program);

// Parse command line arguments
program.parse();