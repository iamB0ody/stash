import chalk from 'chalk';
import boxen from 'boxen';
import figures from 'figures';
import logSymbols from 'log-symbols';
import Table from 'cli-table3';
import type { DiskInfo, ScanResult, CleanResult, StorageOverview } from '@stash/engine';

const RISK_ICONS: Record<string, string> = {
  safe: chalk.green(figures.tick),
  selective: chalk.yellow(figures.warning),
  'display-only': chalk.gray(figures.info),
};

const RISK_LABELS: Record<string, string> = {
  safe: chalk.green('Safe'),
  selective: chalk.yellow('Review'),
  'display-only': chalk.gray('Info'),
};

export function formatBytesSimple(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function renderDiskBar(disk: DiskInfo): string {
  const barWidth = 40;
  const usedWidth = Math.round((disk.usedPercent / 100) * barWidth);
  const freeWidth = barWidth - usedWidth;

  const barChar = '\u2588';
  const emptyChar = '\u2591';
  const barColor =
    disk.usedPercent > 90 ? chalk.red : disk.usedPercent > 70 ? chalk.yellow : chalk.green;

  return barColor(barChar.repeat(usedWidth)) + chalk.gray(emptyChar.repeat(freeWidth));
}

export function displayStorageOverview(overview: StorageOverview): void {
  const lines: string[] = [];

  for (let i = 0; i < overview.disks.length; i++) {
    const disk = overview.disks[i];
    const isPrimary = disk === overview.primary;
    const label = isPrimary
      ? chalk.bold.white(disk.name) + chalk.gray(' (primary)')
      : chalk.bold.white(disk.name);

    if (i > 0) lines.push('');

    lines.push(`${label}  ${chalk.gray(disk.mountPoint)}`);
    lines.push(`${renderDiskBar(disk)}  ${chalk.bold(`${disk.usedPercent}%`)} used`);
    lines.push(
      `${chalk.bold('Used:')}  ${disk.usedHuman}    ${chalk.bold('Free:')}  ${disk.freeHuman}    ${chalk.bold('Total:')}  ${disk.totalHuman}`,
    );
  }

  console.log();
  console.log(
    boxen(lines.join('\n'), {
      title: `${figures.hamburger} Storage Overview`,
      titleAlignment: 'left',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderColor: 'cyan',
      borderStyle: 'round',
    }),
  );
  console.log();
}

export function displayScanResults(results: ScanResult[]): void {
  const table = new Table({
    head: [
      chalk.bold.cyan(''),
      chalk.bold.cyan('Item'),
      chalk.bold.cyan('Size'),
      chalk.bold.cyan('Status'),
    ],
    colWidths: [4, 28, 12, 10],
    style: { head: [], border: ['gray'] },
    chars: {
      top: '\u2500',
      'top-mid': '\u252C',
      'top-left': '\u256D',
      'top-right': '\u256E',
      bottom: '\u2500',
      'bottom-mid': '\u2534',
      'bottom-left': '\u2570',
      'bottom-right': '\u256F',
      left: '\u2502',
      'left-mid': '\u251C',
      mid: '\u2500',
      'mid-mid': '\u253C',
      right: '\u2502',
      'right-mid': '\u2524',
      middle: '\u2502',
    },
  });

  const sorted = [...results].sort((a, b) => b.sizeBytes - a.sizeBytes);

  for (const item of sorted) {
    table.push([
      RISK_ICONS[item.risk],
      item.risk === 'safe'
        ? chalk.white(item.name)
        : item.risk === 'selective'
          ? chalk.yellow(item.name)
          : chalk.gray(item.name),
      chalk.bold(item.sizeHuman),
      RISK_LABELS[item.risk],
    ]);
  }

  console.log(table.toString());

  const totalBytes = results.reduce((sum, r) => sum + r.sizeBytes, 0);
  const cleanableBytes = results
    .filter((r) => r.risk !== 'display-only')
    .reduce((sum, r) => sum + r.sizeBytes, 0);

  console.log();
  console.log(
    `  ${figures.pointer} Total: ${chalk.bold(formatBytesSimple(totalBytes))}  ${chalk.gray('\u2502')}  Cleanable: ${chalk.green.bold(formatBytesSimple(cleanableBytes))}`,
  );
  console.log();
}

export function displayCleanResults(results: CleanResult[]): void {
  let totalFreed = 0;
  const lines: string[] = [];

  for (const result of results) {
    if (result.success) {
      lines.push(
        `${logSymbols.success} ${result.name} ${chalk.gray('\u2014')} freed ${chalk.green.bold(result.freedHuman)}`,
      );
      totalFreed += result.freedBytes;
    } else {
      lines.push(
        `${logSymbols.error} ${result.name} ${chalk.gray('\u2014')} ${chalk.red(result.error || 'failed')}`,
      );
    }
  }

  lines.push('');
  lines.push(`${figures.pointer} Total freed: ${chalk.green.bold(formatBytesSimple(totalFreed))}`);

  console.log();
  console.log(
    boxen(lines.join('\n'), {
      title: `${figures.tick} Cleanup Results`,
      titleAlignment: 'left',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      borderColor: 'green',
      borderStyle: 'round',
    }),
  );
  console.log();
}
