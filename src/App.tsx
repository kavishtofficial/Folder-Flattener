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
import * as XLSX from 'xlsx';
import { ScanResult } from './types';
import { processFiles } from './utils';
import { StatsDisplay } from './components/StatsDisplay';
import { FilePreview } from './components/FilePreview';

export default function App() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [originalScanResult, setOriginalScanResult] = useState<ScanResult | null>(null);
  const [outputName, setOutputName] = useState('Flattened_Archive_2026');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bulkRenameCount, setBulkRenameCount] = useState(0);
  const [flattenFolders, setFlattenFolders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setSuccessMessage(null);
    
    setTimeout(() => {
      const result = processFiles(files);
      setScanResult(result);
      setOriginalScanResult(result);
      setIsProcessing(false);
    }, 300);
  };

  const handleReset = () => {
    setScanResult(null);
    setOriginalScanResult(null);
    setOutputName('Flattened_Archive_2026');
    setSuccessMessage(null);
    setBulkRenameCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (renameInputRef.current) renameInputRef.current.value = '';
  };

  const handleBulkRename = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !originalScanResult) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        let renamedCount = 0;
        const newScanResult = { ...originalScanResult, files: [...originalScanResult.files] };
        
        const removeExtension = (str: string) => {
          const dotIndex = str.lastIndexOf('.');
          return dotIndex !== -1 ? str.substring(0, dotIndex) : str;
        };
        const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

        const renameMap = new Map<string, string>();
        const renameMapNoExt = new Map<string, string>();
        
        // Check if first row is header
        let startIndex = 0;
        if (jsonData.length > 0 && String(jsonData[0][0]).toLowerCase().includes('old')) {
            startIndex = 1;
        }

        for (let i = startIndex; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.length >= 2) {
            const oldName = String(row[0]).trim();
            const newName = String(row[1]).trim();
            if (oldName && newName) {
              const normOld = normalize(oldName);
              const normOldNoExt = normalize(removeExtension(oldName));
              renameMap.set(normOld, newName);
              renameMapNoExt.set(normOldNoExt, newName);
            }
          }
        }
        
        for (let i = 0; i < newScanResult.files.length; i++) {
          const f = newScanResult.files[i];
          const normOrig = normalize(f.originalName);
          const normFlat = normalize(f.flattenedName);
          const normOrigPath = normalize(f.originalPath);
          const normOrigNoExt = normalize(removeExtension(f.originalName));
          const normFlatNoExt = normalize(removeExtension(f.flattenedName));

          let matchedNewName: string | undefined;

          if (renameMap.has(normOrig)) {
            matchedNewName = renameMap.get(normOrig);
          } else if (renameMap.has(normFlat)) {
            matchedNewName = renameMap.get(normFlat);
          } else if (renameMap.has(normOrigPath)) {
            matchedNewName = renameMap.get(normOrigPath);
          } else if (renameMapNoExt.has(normOrigNoExt)) {
            matchedNewName = renameMapNoExt.get(normOrigNoExt);
          } else if (renameMapNoExt.has(normFlatNoExt)) {
            matchedNewName = renameMapNoExt.get(normFlatNoExt);
          }
          
          if (matchedNewName) {
            // If the new name doesn't have an extension but the original did, append it
            const origExt = f.originalName.lastIndexOf('.') !== -1 ? f.originalName.substring(f.originalName.lastIndexOf('.')) : '';
            if (origExt && !matchedNewName.toLowerCase().endsWith(origExt.toLowerCase())) {
              matchedNewName += origExt;
            }
            
            if (matchedNewName !== f.flattenedName) {
              newScanResult.files[i] = { ...f, flattenedName: matchedNewName, isBulkRenamed: true };
              renamedCount++;
            }
          }
        }
        
        setScanResult(newScanResult);
        setBulkRenameCount(renamedCount);
      } catch (error) {
        console.error("Error parsing Excel file", error);
        alert("Failed to parse the Excel/CSV file. Please ensure it has two columns: Old Name and New Name.");
      }
    };
    reader.readAsArrayBuffer(file);
    if (renameInputRef.current) renameInputRef.current.value = '';
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
        // Use a custom property instead of modifying protected webkitRelativePath
        (file as any).customPath = path + file.name;
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
      setOriginalScanResult(result);
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
      if (flattenFolders) {
        folder.file(f.flattenedName, f.file);
      } else {
        const pathParts = f.originalPath.split('/');
        if (pathParts.length > 1) {
          pathParts.pop(); // remove original filename
          const dirPath = pathParts.join('/');
          folder.file(`${dirPath}/${f.flattenedName}`, f.file);
        } else {
          folder.file(f.flattenedName, f.file);
        }
      }
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
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">By VangaVault</p>
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
        <aside className="w-80 shrink-0 flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-2">
          
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

          {/* Control: Bulk Rename */}
          <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all ${!scanResult ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bulk Rename (Optional)</h3>
              {bulkRenameCount > 0 && (
                <button 
                  onClick={() => {
                    setScanResult(originalScanResult);
                    setBulkRenameCount(0);
                    if (renameInputRef.current) renameInputRef.current.value = '';
                  }}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
              Upload an Excel (.xlsx) or CSV file with two columns to rename files in bulk. 
              <br/><span className="font-semibold text-slate-700">Col A:</span> Old Name &nbsp;|&nbsp; <span className="font-semibold text-slate-700">Col B:</span> New Name
            </p>
            
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              ref={renameInputRef}
              onChange={handleBulkRename}
            />

            <button 
              onClick={() => renameInputRef.current?.click()}
              disabled={!scanResult}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center space-x-2 transition-all font-semibold text-sm disabled:opacity-50 border border-slate-200"
            >
              <span>📄</span>
              <span>Upload Mapping File</span>
            </button>
            
            {bulkRenameCount > 0 && (
              <div className="mt-3 flex items-center justify-center space-x-2 text-[10px] font-bold text-green-600 uppercase tracking-wider bg-green-50 p-2 rounded-lg border border-green-100">
                <CheckCircle2 size={12} />
                <span>Renamed {bulkRenameCount} files</span>
              </div>
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

              <div className="flex items-center space-x-2 mt-4">
                <input 
                  type="checkbox" 
                  id="flattenToggle"
                  checked={flattenFolders}
                  onChange={(e) => setFlattenFolders(e.target.checked)}
                  className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                />
                <label htmlFor="flattenToggle" className="text-sm font-semibold text-slate-700 select-none cursor-pointer">
                  Flatten into single folder
                </label>
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
                <span>{isZipping ? 'Processing...' : (flattenFolders ? 'Flatten & Download' : 'Download Folder')}</span>
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

