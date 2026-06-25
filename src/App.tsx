/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderDown, 
  Download, 
  RefreshCcw, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ScanResult } from './types';
import { processFiles } from './utils';
import { StatsDisplay } from './components/StatsDisplay';
import { FilePreview } from './components/FilePreview';

export default function App() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [outputName, setOutputName] = useState('Flattened_Archive_2026');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setSuccessMessage(null);
    
    setTimeout(() => {
      const result = processFiles(files);
      setScanResult(result);
      setIsProcessing(false);
    }, 300);
  };

  const handleReset = () => {
    setScanResult(null);
    setOutputName('Flattened_Archive_2026');
    setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setIsProcessing(true);
    setSuccessMessage(null);

    const files: File[] = [];
    
    const traverse = async (entry: any, path: string = "") => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => entry.file(resolve));
        Object.defineProperty(file, 'webkitRelativePath', {
          value: path + file.name,
          writable: false,
          configurable: true
        });
        files.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise<any[]>((resolve) => {
          const allEntries: any[] = [];
          const readEntries = () => {
            reader.readEntries((results: any[]) => {
              if (results.length) {
                allEntries.push(...results);
                readEntries();
              } else {
                resolve(allEntries);
              }
            });
          };
          readEntries();
        });
        
        for (const childEntry of entries) {
          await traverse(childEntry, path + entry.name + "/");
        }
      }
    };

    const promises = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) {
        promises.push(traverse(entry));
      }
    }

    await Promise.all(promises);
    
    if (files.length > 0) {
      const result = processFiles(files);
      setScanResult(result);
    }
    setIsProcessing(false);
  };

  const handleDownload = async () => {
    if (!scanResult) return;

    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder(outputName || 'Flattened_Archive');

    if (!folder) return;

    for (const f of scanResult.files) {
      folder.file(f.flattenedName, f.file);
    }

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const finalName = (outputName || 'Flattened_Archive').trim();
      saveAs(content, `${finalName}.zip`);
      
      setSuccessMessage(`Download Complete! ${scanResult.files.length} files saved.`);
    } catch (error) {
      console.error('Zipping failed:', error);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header Section */}
      <header className="flex items-center justify-between px-10 pt-8 pb-6 border-b border-slate-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xl font-bold">
            F
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Folder Flattener</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Local Client-Side Utility</p>
          </div>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>Privacy Guaranteed: Local Processing Only</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex p-10 space-x-8 min-h-0">
        
        {/* Left Pane: File Discovery List */}
        <FilePreview files={scanResult?.files || []} />

        {/* Right Pane: Actions & Controls */}
        <aside className="w-80 flex flex-col space-y-6">
          
          {/* Control: Folder Select */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Input Source</h3>
              {scanResult && (
                <button 
                  onClick={handleReset}
                  className="text-[10px] font-bold text-red-500 uppercase tracking-wider hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderSelect}
            />

            <button 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              disabled={isProcessing}
              className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center space-y-2 transition-all disabled:opacity-50 ${
                isDragging 
                  ? 'border-slate-900 bg-slate-50 scale-[1.02]' 
                  : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className="text-2xl">
                {isProcessing ? (
                  <Loader2 className="animate-spin text-slate-400" />
                ) : isDragging ? (
                  '📥'
                ) : (
                  '📂'
                )}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                {isProcessing ? 'Scanning...' : isDragging ? 'Release to Scan' : 'Select or Drop Folder'}
              </span>
            </button>
            
            {scanResult && (
              <p className="mt-3 text-[10px] text-center text-slate-400 italic truncate">
                Ready to flatten {scanResult.files.length} files
              </p>
            )}
          </div>

          {/* Control: Settings & Export */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Export Configuration</h3>
            
            <div className="space-y-5 flex-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">Output Zip Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 text-sm italic">.zip</span>
                </div>
              </div>

              {scanResult && (
                <StatsDisplay 
                  fileCount={scanResult.files.length} 
                  folderCount={scanResult.subfolderCount}
                  conflictCount={scanResult.conflicts.length}
                  totalSize={scanResult.totalSize}
                />
              )}
            </div>

            <div className="pt-6">
              <button 
                onClick={handleDownload}
                disabled={!scanResult || isZipping}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 active:transform active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:bg-slate-200 disabled:shadow-none"
              >
                <span>{isZipping ? 'Processing...' : 'Flatten & Download'}</span>
                {isZipping ? <RefreshCcw className="animate-spin text-white" size={18} /> : <span className="text-lg">🚀</span>}
              </button>
              
              <AnimatePresence>
                {successMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 flex items-center justify-center space-x-2"
                  >
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-[11px] font-bold text-green-600">{successMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer / System Stats */}
      <footer className="px-10 py-4 flex items-center justify-between bg-slate-50 border-t border-slate-200">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Engine: JSZip • Browser Processing Only
        </div>
        <div className="flex space-x-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Status: {scanResult ? 'Ready' : 'Idle'}</span>
          <span>Files: {scanResult?.files.length || 0}</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

