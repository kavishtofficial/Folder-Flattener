/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScannedFile } from '../types';

interface FilePreviewProps {
  files: ScannedFile[];
}

export const FilePreview: React.FC<FilePreviewProps> = ({ files }) => {
  return (
    <section className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Found Files Preview</h2>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{files.length} items</span>
      </div>
      
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
        {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-40">
            <span className="text-4xl mb-4">📂</span>
            <p className="text-sm font-medium text-slate-400">No folder selected yet</p>
          </div>
        ) : (
          files.map((f, i) => (
            <div 
              key={i} 
              className={`px-6 py-4 flex items-center hover:bg-slate-50 transition-colors ${
                f.isRenamed ? 'bg-orange-50/30 border-l-4 border-orange-400' : ''
              }`}
            >
              <span className="text-2xl mr-4">{f.file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {f.flattenedName}
                </div>
                <div className={`text-[11px] truncate ${f.isRenamed ? 'text-orange-500 font-medium italic' : 'text-slate-400'}`}>
                  {f.isRenamed ? `Renamed from: ${f.originalPath}` : f.originalPath}
                </div>
              </div>
              {f.isRenamed ? (
                <div className="ml-4 flex items-center text-[9px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded uppercase whitespace-nowrap">
                  Duplicate Found
                </div>
              ) : (
                <div className="ml-4 text-[10px] font-mono text-slate-400 px-2 py-1 bg-slate-100 rounded whitespace-nowrap">
                  {(f.file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};
