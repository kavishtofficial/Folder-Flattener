/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScannedFile {
  originalPath: string;
  originalName: string;
  flattenedName: string;
  file: File;
  isRenamed: boolean;
}

export interface ConflictLog {
  originalPath: string;
  newName: string;
}

export interface ScanResult {
  files: ScannedFile[];
  subfolderCount: number;
  conflicts: ConflictLog[];
  totalSize: number;
}
