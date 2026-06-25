/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface StatsDisplayProps {
  fileCount: number;
  folderCount: number;
  conflictCount: number;
  totalSize: number;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ fileCount, folderCount, conflictCount, totalSize }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Files</div>
        <div className="text-xl font-bold text-slate-900">{fileCount}</div>
      </div>
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subfolders</div>
        <div className="text-xl font-bold text-slate-900">{folderCount}</div>
      </div>
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Export Size</div>
        <div className="text-xl font-bold text-slate-900">{formatSize(totalSize)}</div>
      </div>
      {conflictCount > 0 && (
        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 col-span-2">
          <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Duplicate Conflicts</div>
          <div className="text-xl font-bold text-orange-700">{conflictCount}</div>
        </div>
      )}
    </div>
  );
};
