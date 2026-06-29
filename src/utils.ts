/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScanResult, ScannedFile, ConflictLog } from './types';

export function processFiles(fileList: FileList | File[]): ScanResult {
  const files: ScannedFile[] = [];
  const conflicts: ConflictLog[] = [];
  const nameCounts: Record<string, number> = {};
  const subfolders = new Set<string>();
  let totalSize = 0;

  // Convert to Array and sort by path for consistency
  const fileArray = Array.from(fileList);

  const MAX_FILENAME_LENGTH = 100; // Shorter limit for better system compatibility

  for (const file of fileArray) {
    totalSize += file.size;
    const path = file.webkitRelativePath || (file as any).customPath || file.name;
    const pathParts = path.split('/');
    
    // Track subfolders
    for (let i = 1; i < pathParts.length; i++) {
      subfolders.add(pathParts.slice(0, i).join('/'));
    }

    const originalName = file.name;
    let isRenamed = false;
    
    // 1. Clean illegal characters
    // Remove characters that are illegal on Windows/MacOS/Linux file systems
    const cleanedName = originalName.replace(/[<>:"/\\|?*]/g, '_');
    if (cleanedName !== originalName) isRenamed = true;

    // 2. Initial Shortening
    let baseName: string;
    let extension: string;
    const dotIndex = cleanedName.lastIndexOf('.');
    if (dotIndex !== -1) {
      baseName = cleanedName.substring(0, dotIndex);
      extension = cleanedName.substring(dotIndex);
    } else {
      baseName = cleanedName;
      extension = '';
    }

    let candidateName = cleanedName;
    if (candidateName.length > MAX_FILENAME_LENGTH) {
      isRenamed = true;
      const allowedBaseLength = Math.max(10, MAX_FILENAME_LENGTH - extension.length);
      baseName = baseName.substring(0, allowedBaseLength);
      candidateName = baseName + extension;
    }

    // 3. Collision Handling
    let finalName = candidateName;
    if (nameCounts[finalName] !== undefined) {
      isRenamed = true;
      nameCounts[candidateName]++;
      const count = nameCounts[candidateName];
      
      // Re-shorten if adding " (n)" exceeds limit
      const suffix = ` (${count})`;
      const allowedBaseForCollision = Math.max(10, MAX_FILENAME_LENGTH - extension.length - suffix.length);
      const shortenedBase = baseName.substring(0, allowedBaseForCollision);
      finalName = `${shortenedBase}${suffix}${extension}`;
      
      conflicts.push({
        originalPath: path,
        newName: finalName
      });
    } else {
      nameCounts[finalName] = 0;
    }

    files.push({
      originalPath: path,
      originalName,
      flattenedName: finalName,
      file,
      isRenamed
    });
  }

  return {
    files,
    subfolderCount: subfolders.size,
    conflicts,
    totalSize
  };
}
