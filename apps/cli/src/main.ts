#!/usr/bin/env node

import chalk from 'chalk';
import boxen from 'boxen';
import figures from 'figures';
import ora from 'ora';
import * as p from '@clack/prompts';
import {
  createEngine,
  logAction,
  getHistory,
  clearHistory,
  type Platform,
  type ScanResult,
  type CleanResult,
} from '@stash/engine';
import {
  displayStorageOverview,
  displayScanResults,
  displayCleanResults,
  formatBytesSimple,
} from './display.js';

const VERSION = '0.1.0';

// ──── Banner ────

function showBanner() {
  console.clear();
  console.log();
  console.log(
    chalk.bold.cyan(
      [
        '  ███████╗████████╗ █████╗ ███████╗██╗  ██╗',
        '  ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║  ██║',
        '  ███████╗   ██║   █████████║███████╗███████║',
        '  ╚════██║   ██║   ██╔══██║╚════██║██╔══██║',
        '  ███████║   ██║   ██║  ██║███████║██║  ██║',
        '  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝',
      ].join('\n'),
    ),
  );
  console.log();
  console.log(
    boxen(
      `${chalk.bold('Stash It')} ${chalk.gray(`v${VERSION}`)}\n${chalk.gray("Your disk is full of junk. Let's fix that.")}`,
      {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderColor: 'gray',
        borderStyle: 'round',
        textAlignment: 'center',
      },
    ),
  );
  console.log();
}

// ──── Logging helpers ────

function logCleanResults(
  results: CleanResult[],
  action: 'clean' | 'quick-clean',
  platformName: string,
) {
  for (const result of results) {
    logAction({
      action,
      categoryId: result.id,
      categoryName: result.name,
      freedBytes: result.freedBytes,
      freedHuman: result.freedHuman,
      success: result.success,
      platform: platformName,
      error: result.error,
    });
  }
}

// ──── Flows ────

async function runScan(engine: Platform): Promise<ScanResult[]> {
  const spinner = ora('Scanning your disks...').start();

  const overview = await engine.getStorageOverview();
  const results = await engine.scanAll((name) => {
    spinner.text = `Scanning ${name}...`;
  });

  spinner.stop();
  displayStorageOverview(overview);
  displayScanResults(results);

  // Log scan action
  const totalBytes = results.reduce((sum, r) => sum + r.sizeBytes, 0);
  logAction({
    action: 'scan',
    categoryId: 'all',
    categoryName: 'Full Scan',
    freedBytes: 0,
    freedHuman: '0 B',
    success: true,
    platform: engine.name,
  });

  return results;
}

async function mainMenu(): Promise<string | symbol> {
  return p.select({
    message: 'What would you like to do?',
    options: [
      { label: 'Scan Storage', value: 'scan', hint: 'Analyze disk usage' },
      { label: 'Quick Clean', value: 'quick-clean', hint: 'Clean all safe caches' },
      { label: 'Select & Clean', value: 'select-clean', hint: 'Pick what to clean' },
      { label: 'Dev Tools', value: 'devtools', hint: 'iOS Sims, Android SDK' },
      { label: 'History', value: 'history', hint: 'View past actions' },
      { label: 'Exit', value: 'exit' },
    ],
  });
}

async function quickCleanFlow(engine: Platform) {
  p.intro(chalk.bold.green('Quick Clean — All Safe Items'));

  const spinner = ora('Scanning safe items...').start();
  const results = await engine.scanAll((name) => {
    spinner.text = `Checking ${name}...`;
  });
  spinner.stop();

  const safeItems = results.filter((r) => r.risk === 'safe');

  if (safeItems.length === 0) {
    p.log.warn('No safe items found to clean.');
    p.outro('Nothing to do.');
    return;
  }

  console.log();
  let totalCleanable = 0;
  for (const item of safeItems) {
    p.log.info(`${item.name.padEnd(25)} ${chalk.bold(item.sizeHuman)}`);
    totalCleanable += item.sizeBytes;
  }

  console.log();
  p.log.message(`${figures.pointer} Total: ${chalk.green.bold(formatBytesSimple(totalCleanable))}`);

  const confirmed = await p.confirm({
    message: `Proceed with cleanup? ${chalk.gray('(Y/n)')}`,
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.outro(chalk.gray('Cancelled.'));
    return;
  }

  console.log();
  const cleanResults = await engine.cleanAllSafe();
  displayCleanResults(cleanResults);
  logCleanResults(cleanResults, 'quick-clean', engine.name);
}

async function selectCleanFlow(engine: Platform) {
  p.intro(chalk.bold.yellow('Select & Clean'));

  const spinner = ora('Scanning...').start();
  const results = await engine.scanAll((name) => {
    spinner.text = `Scanning ${name}...`;
  });
  spinner.stop();

  const safeItems = results.filter((r) => r.risk === 'safe');
  const selectiveItems = results.filter((r) => r.risk === 'selective');

  if (safeItems.length === 0 && selectiveItems.length === 0) {
    p.log.warn('Nothing to clean!');
    p.outro('All clear.');
    return;
  }

  const options = [
    ...safeItems.map((item) => ({
      label: `${item.name.padEnd(25)} ${chalk.bold(item.sizeHuman)}`,
      value: item.id,
      hint: 'safe',
    })),
    ...selectiveItems.map((item) => ({
      label: `${item.name.padEnd(25)} ${chalk.bold(item.sizeHuman)}`,
      value: item.id,
      hint: 'review needed',
    })),
  ];

  p.log.message(
    chalk.gray(
      `${figures.arrowDown}${figures.arrowUp} Navigate  Space to toggle  A to select all  Enter to confirm`,
    ),
  );

  const selected = await p.multiselect({
    message: 'Select items to clean:',
    options,
    required: false,
  });

  if (p.isCancel(selected) || selected.length === 0) {
    p.outro(chalk.gray('Nothing selected.'));
    return;
  }

  p.log.step(chalk.bold('You selected:'));
  for (const id of selected) {
    const item = results.find((r) => r.id === id);
    if (item) p.log.info(`${figures.arrowRight} ${item.name} (${item.sizeHuman})`);
  }

  const confirmed = await p.confirm({
    message: `Proceed with cleanup? ${chalk.gray('(Y/n)')}`,
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.outro(chalk.gray('Cancelled.'));
    return;
  }

  console.log();
  const cleanResults: CleanResult[] = [];
  const categories = engine.getCategories();

  for (const id of selected) {
    const category = categories.find((c) => c.id === id);
    if (!category) continue;

    if (category.risk === 'selective') {
      await handleSelectiveClean(engine, id);
    } else {
      const result = await engine.cleanItem(id);
      cleanResults.push(result);
    }
  }

  if (cleanResults.length > 0) {
    displayCleanResults(cleanResults);
    logCleanResults(cleanResults, 'clean', engine.name);
  }
}

async function handleSelectiveClean(engine: Platform, categoryId: string) {
  const items = await engine.listSelectiveItems(categoryId);

  if (items.length === 0) {
    p.log.warn('No items found.');
    return;
  }

  p.log.message(
    chalk.gray(
      `${figures.arrowDown}${figures.arrowUp} Navigate  Space to toggle  A to select all  Enter to confirm`,
    ),
  );

  const selected = await p.multiselect({
    message: 'Select items to delete:',
    options: items.map((item) => ({
      label: `${item.name}  ${chalk.gray(`[${item.size}]`)}`,
      value: item.id,
    })),
    required: false,
  });

  if (p.isCancel(selected) || selected.length === 0) {
    p.log.info('No items selected.');
    return;
  }

  const spinner = ora('Deleting...').start();
  const results = await engine.deleteSelectiveItems(categoryId, selected);
  spinner.stop();

  for (const result of results) {
    if (result.success) {
      p.log.success(`Deleted ${result.name}`);
    } else {
      p.log.error(`Failed: ${result.name} — ${result.error}`);
    }
  }

  // Log selective deletions
  for (const result of results) {
    logAction({
      action: 'selective-delete',
      categoryId,
      categoryName: result.name,
      freedBytes: result.freedBytes,
      freedHuman: result.freedHuman,
      success: result.success,
      platform: engine.name,
      error: result.error,
    });
  }
}

async function devToolsFlow(engine: Platform) {
  p.intro(chalk.bold.magenta('Dev Tools Manager'));

  const options: { label: string; value: string; hint?: string }[] = [];

  // Show iOS Simulators only on macOS
  if (engine.id === 'mac') {
    options.push({
      label: 'iOS Simulators',
      value: 'ios-simulators',
      hint: 'Remove unused runtimes',
    });
  }

  options.push(
    { label: 'Android SDK Platforms', value: 'android-sdk', hint: 'Remove old versions' },
    { label: 'Android Emulators', value: 'android-emulators', hint: 'Delete unused AVDs' },
    { label: 'Back to main menu', value: 'back' },
  );

  const tool = await p.select({
    message: 'Select a dev tool to manage:',
    options,
  });

  if (p.isCancel(tool) || tool === 'back') return;

  await handleSelectiveClean(engine, tool);
}

async function historyFlow() {
  p.intro(chalk.bold.blue('Action History'));

  const history = getHistory(50);

  if (history.length === 0) {
    p.log.info('No actions recorded yet. Start cleaning to build your history!');
    p.outro('');
    return;
  }

  console.log();
  for (const entry of history) {
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const icon = entry.success ? chalk.green(figures.tick) : chalk.red(figures.cross);
    const actionLabel =
      entry.action === 'scan'
        ? chalk.cyan('SCAN')
        : entry.action === 'quick-clean'
          ? chalk.green('QUICK')
          : entry.action === 'selective-delete'
            ? chalk.yellow('SELECT')
            : chalk.blue('CLEAN');

    const freed =
      entry.freedBytes > 0 ? chalk.green(`+${entry.freedHuman} freed`) : chalk.gray('—');

    console.log(
      `  ${icon} ${chalk.gray(`${dateStr} ${timeStr}`)}  ${actionLabel}  ${entry.categoryName.padEnd(22)} ${freed}`,
    );
  }

  console.log();

  const totalFreed = history.filter((e) => e.success).reduce((sum, e) => sum + e.freedBytes, 0);

  if (totalFreed > 0) {
    p.log.message(
      `${figures.pointer} Total freed (all time): ${chalk.green.bold(formatBytesSimple(totalFreed))}`,
    );
  }

  const action = await p.select({
    message: 'Options:',
    options: [
      { label: 'Back to main menu', value: 'back' },
      { label: 'Clear history', value: 'clear', hint: 'Remove all history entries' },
    ],
  });

  if (!p.isCancel(action) && action === 'clear') {
    const confirmed = await p.confirm({
      message: 'Clear all history?',
      initialValue: false,
    });

    if (!p.isCancel(confirmed) && confirmed) {
      clearHistory();
      p.log.success('History cleared.');
    }
  }
}

async function scanFlow(engine: Platform) {
  p.intro(chalk.bold.cyan('Storage Scan'));
  await runScan(engine);
}

// ──── Main ────

async function main() {
  showBanner();

  const engine = await createEngine();

  const spinner = ora('Initializing...').start();
  const overview = await engine.getStorageOverview();
  spinner.stop();

  for (const disk of overview.disks) {
    const usedColor =
      disk.usedPercent > 90 ? chalk.red : disk.usedPercent > 70 ? chalk.yellow : chalk.green;
    const label = disk === overview.primary ? chalk.bold(disk.name) : disk.name;
    console.log(
      `  ${figures.pointer} ${label} ${chalk.gray('—')} ${usedColor.bold(`${disk.usedPercent}% used`)} ${chalk.gray('—')} ${disk.usedHuman} / ${disk.totalHuman}`,
    );
  }
  console.log(
    chalk.gray(
      `  ${figures.arrowDown}${figures.arrowUp} Navigate  ${figures.pointer} Enter to select  Space to toggle  Ctrl+C to exit`,
    ),
  );
  console.log();

  while (true) {
    const action = await mainMenu();

    if (p.isCancel(action)) {
      p.outro(chalk.cyan(`${figures.heart} Your disk thanks you. Goodbye!`));
      process.exit(0);
    }

    switch (action) {
      case 'scan':
        await scanFlow(engine);
        break;
      case 'quick-clean':
        await quickCleanFlow(engine);
        break;
      case 'select-clean':
        await selectCleanFlow(engine);
        break;
      case 'devtools':
        await devToolsFlow(engine);
        break;
      case 'history':
        await historyFlow();
        break;
      case 'exit':
        p.outro(chalk.cyan(`${figures.heart} Goodbye!`));
        process.exit(0);
    }

    const cont = await p.confirm({ message: 'Back to main menu?', initialValue: true });

    if (p.isCancel(cont) || !cont) {
      p.outro(chalk.cyan(`${figures.heart} Goodbye!`));
      process.exit(0);
    }

    showBanner();
  }
}

main().catch((err) => {
  p.cancel(chalk.red(err.message));
  process.exit(1);
});
