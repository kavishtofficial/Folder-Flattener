/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScanResult, ScannedFile, ConflictLog } from './types';

export function processFiles(fileList: FileList): ScanResult {
  const files: ScannedFile[] = [];
  const conflicts: ConflictLog[] = [];
  const nameCounts: Record<string, number> = {};
  const subfolders = new Set<string>();

  // Convert FileList to Array and sort by path for consistency
  const fileArray = Array.from(fileList);

  for (const file of fileArray) {
    const path = file.webkitRelativePath || file.name;
    const pathParts = path.split('/');
    
    // Track subfolders
    // Example: "folder/sub/file.txt" -> subfolders: "folder", "folder/sub"
    for (let i = 1; i < pathParts.length; i++) {
      subfolders.add(pathParts.slice(0, i).join('/'));
    }

    const originalName = file.name;
    let flattenedName = originalName;
    let isRenamed = false;

    // Handle duplicates
    if (nameCounts[flattenedName] !== undefined) {
      isRenamed = true;
      const dotIndex = originalName.lastIndexOf('.');
      const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
      const extension = dotIndex !== -1 ? originalName.substring(dotIndex) : '';

      nameCounts[originalName]++;
      const count = nameCounts[originalName];
      flattenedName = `${baseName} (${count})${extension}`;
      
      conflicts.push({
        originalPath: path,
        newName: flattenedName
      });
    } else {
      nameCounts[flattenedName] = 0;
    }

    files.push({
      originalPath: path,
      originalName,
      flattenedName,
      file,
      isRenamed
    });
  }

  return {
    files,
    subfolderCount: subfolders.size,
    conflicts
  };
}
