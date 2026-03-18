export type RiskLevel = 'safe' | 'selective' | 'display-only';

export interface Category {
  id: string;
  name: string;
  risk: RiskLevel;
  description: string;
  paths: string[];
  cleanCommand?: string;
  detectCommand?: string;
}

export interface ScanResult {
  id: string;
  name: string;
  risk: RiskLevel;
  description: string;
  sizeBytes: number;
  sizeHuman: string;
  available: boolean;
}

export interface DiskInfo {
  name: string;
  mountPoint: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  totalHuman: string;
  usedHuman: string;
  freeHuman: string;
  usedPercent: number;
}

export interface StorageOverview {
  disks: DiskInfo[];
  primary: DiskInfo;
}

export interface CleanResult {
  id: string;
  name: string;
  success: boolean;
  freedBytes: number;
  freedHuman: string;
  error?: string;
}

export interface DevToolItem {
  name: string;
  id: string;
  size: string;
  sizeBytes: number;
}

export interface ActionLogEntry {
  timestamp: string;
  action: 'clean' | 'selective-delete' | 'quick-clean' | 'scan';
  categoryId: string;
  categoryName: string;
  freedBytes: number;
  freedHuman: string;
  success: boolean;
  platform: string;
  error?: string;
}
