#!/usr/bin/env node

import { Command } from 'commander';
import { registerCommands } from './commands/register.js';
import { CommandLogger, setCurrentLogger, getCurrentLogger } from './utils/logger.js';

const program = new Command();

program
  .name('aci')
  .description('ArcGIS Command Line Interface for enterprise workflows')
  .version('0.1.0')
  .option('--tui', 'Launch Terminal User Interface')
  .option('--verbose', 'Enable verbose logging')
  .option('--debug', 'Enable debug logging')
  .option('--quiet', 'Suppress non-error output');

// Add logging hook for all commands
program.hook('preAction', (thisCommand) => {
  // Set environment variables for logging
  if (thisCommand.opts().verbose) process.env.ACI_VERBOSE = 'true';
  if (thisCommand.opts().debug) process.env.ACI_DEBUG = 'true';
  if (thisCommand.opts().quiet) process.env.ACI_QUIET = 'true';
  
  // Create and set logger for this command
  const logger = new CommandLogger(thisCommand);
  setCurrentLogger(logger);
  (thisCommand as any).logger = logger;
  
  logger.start(`Executing ${thisCommand.name()}`, { 
    arguments: thisCommand.args,
    options: thisCommand.opts()
  });
});

// Add post-action hook for command completion logging
program.hook('postAction', (thisCommand) => {
  const logger = (thisCommand as any).logger;
  if (logger && typeof logger.complete === 'function') {
    logger.complete(true); // Assume success if we reach here
  }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  const logger = getCurrentLogger();
  if (logger && typeof logger.complete === 'function') {
    logger.complete(false, error);
  }
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const logger = getCurrentLogger();
  if (logger && typeof logger.complete === 'function') {
    logger.complete(false, reason instanceof Error ? reason : String(reason));
  }
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

// Check for TUI flag before registering commands
const args = process.argv;
const tuiFlag = args.includes('--tui');

if (tuiFlag) {
  // Launch TUI mode
  const { startTui } = await import('./tui/app.js');
  await startTui();
} else {
  // Standard CLI mode
  registerCommands(program);
  program.parse();
}