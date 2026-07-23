/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ScannedFile } from '../types';
import { AlertTriangle, Filter, CheckCircle2 } from 'lucide-react';

interface FilePreviewProps {
  files: ScannedFile[];
}

type FilterType = 'all' | 'images' | 'documents';

export const FilePreview: React.FC<FilePreviewProps> = ({ files }) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const isDocument = (file: File) => {
    const docTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/csv',
      'application/rtf'
    ];
    const docExtensions = ['.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.rtf', '.md'];
    return docTypes.includes(file.type) || docExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const filteredFiles = useMemo(() => {
    if (filter === 'all') return files;
    if (filter === 'images') return files.filter(f => f.file.type.startsWith('image/'));
    if (filter === 'documents') return files.filter(f => isDocument(f.file));
    return files;
  }, [files, filter]);

  return (
    <section className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
        <div className="flex justify-between items-center">
          <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Found Files Preview</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredFiles.length} of {files.length} items</span>
        </div>
        
        {files.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400">
              <Filter size={12} />
            </div>
            <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1">
              {(['all', 'images', 'documents'] as FilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    filter === t 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
        {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-40">
            <span className="text-4xl mb-4">📂</span>
            <p className="text-sm font-medium text-slate-400">No folder selected yet</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-40">
            <span className="text-4xl mb-4">🔍</span>
            <p className="text-sm font-medium text-slate-400">No {filter} found in this folder</p>
          </div>
        ) : (
          filteredFiles.map((f, i) => (
            <div 
              key={i} 
              className={`px-6 py-4 flex items-center hover:bg-slate-50 transition-colors ${
                f.isRenamed || f.isBulkRenamed ? (f.isBulkRenamed ? 'bg-blue-50/50 border-l-4 border-blue-400' : 'bg-yellow-50/80 border-l-4 border-yellow-400') : ''
              }`}
            >
              <span className="text-2xl mr-4">
                {f.file.type.startsWith('image/') ? '🖼️' : isDocument(f.file) ? '📄' : '📦'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {f.flattenedName}
                </div>
                <div className={`text-[11px] truncate ${f.isRenamed || f.isBulkRenamed ? (f.isBulkRenamed ? 'text-blue-700 font-medium italic' : 'text-yellow-700 font-medium italic') : 'text-slate-400'}`}>
                  {f.isRenamed || f.isBulkRenamed ? `Renamed from: ${f.originalPath}` : f.originalPath}
                </div>
              </div>
              {f.isBulkRenamed ? (
                <div className="ml-4 flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded uppercase whitespace-nowrap">
                  <CheckCircle2 size={10} />
                  Bulk Renamed
                </div>
              ) : f.isRenamed ? (
                <div className="ml-4 flex items-center gap-1 text-[9px] font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded uppercase whitespace-nowrap">
                  <AlertTriangle size={10} />
                  Collision
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
