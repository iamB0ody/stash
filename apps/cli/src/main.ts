#!/usr/bin/env node

import chalk from 'chalk';
import boxen from 'boxen';
import figures from 'figures';
import ora from 'ora';
import * as p from '@clack/prompts';
import { createEngine, type Platform, type ScanResult, type CleanResult } from '@stash/engine';
import { displayStorageOverview, displayScanResults, displayCleanResults, formatBytesSimple } from './display.js';

const VERSION = '0.1.0';

// ──── Banner ────

function showBanner() {
  console.clear();
  console.log();
  console.log(
    chalk.bold.cyan(
      [
        '  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557',
        '  \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2551  \u2588\u2588\u2551',
        '  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557   \u2588\u2588\u2551   \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551',
        '  \u255A\u2550\u2550\u2550\u2550\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u255A\u2550\u2550\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551',
        '  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551   \u2588\u2588\u2551   \u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2551',
        '  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D   \u255A\u2550\u255D   \u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D',
      ].join('\n'),
    ),
  );
  console.log();
  console.log(
    boxen(
      `${chalk.bold('Stash')} ${chalk.gray(`v${VERSION}`)}\n${chalk.gray('Storage Cleaner for Developers')}`,
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
      { label: 'Exit', value: 'exit' },
    ],
  });
}

async function quickCleanFlow(engine: Platform) {
  p.intro(chalk.bold.green('Quick Clean \u2014 All Safe Items'));

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

  const confirmed = await p.confirm({ message: 'Proceed with cleanup?', initialValue: false });

  if (p.isCancel(confirmed) || !confirmed) {
    p.outro(chalk.gray('Cancelled.'));
    return;
  }

  console.log();
  const cleanResults = await engine.cleanAllSafe();
  displayCleanResults(cleanResults);
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

  const confirmed = await p.confirm({ message: 'Proceed with cleanup?', initialValue: false });

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
  }
}

async function handleSelectiveClean(engine: Platform, categoryId: string) {
  const items = await engine.listSelectiveItems(categoryId);

  if (items.length === 0) {
    p.log.warn('No items found.');
    return;
  }

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
      p.log.error(`Failed: ${result.name} \u2014 ${result.error}`);
    }
  }
}

async function devToolsFlow(engine: Platform) {
  p.intro(chalk.bold.magenta('Dev Tools Manager'));

  const tool = await p.select({
    message: 'Select a dev tool to manage:',
    options: [
      { label: 'iOS Simulators', value: 'ios-simulators', hint: 'Remove unused runtimes' },
      { label: 'Android SDK Platforms', value: 'android-sdk', hint: 'Remove old versions' },
      { label: 'Android Emulators', value: 'android-emulators', hint: 'Delete unused AVDs' },
      { label: 'Back to main menu', value: 'back' },
    ],
  });

  if (p.isCancel(tool) || tool === 'back') return;

  await handleSelectiveClean(engine, tool);
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
      `  ${figures.pointer} ${label} ${chalk.gray('\u2014')} ${usedColor.bold(`${disk.usedPercent}% used`)} ${chalk.gray('\u2014')} ${disk.usedHuman} / ${disk.totalHuman}`,
    );
  }
  console.log();

  while (true) {
    const action = await mainMenu();

    if (p.isCancel(action)) {
      p.outro(chalk.cyan(`${figures.heart} Your Mac thanks you. Goodbye!`));
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
