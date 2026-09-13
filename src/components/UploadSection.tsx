import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Camera, 
  Sparkles, 
  Layers, 
  X, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { CardType, DelimiterType, MbbsSubject } from '../types';
import { DELIMITER_MAP } from '../utils/ankiExport';
import { SAMPLE_DECKS } from '../data/sampleDecks';
import { MBBS_SUBJECTS, getMbbsSubjectInfo } from '../utils/mbbsSubjects';

interface UploadSectionProps {
  onAnalyze: (payload: {
    fileData?: string;
    mimeType?: string;
    fileName?: string;
    textContent?: string;
    cardFormat: CardType | 'mixed';
    delimiter: DelimiterType;
    targetCount: number;
    deckName?: string;
    customInstructions?: string;
    subject?: MbbsSubject;
  }) => Promise<void>;
  isLoading: boolean;
  onLoadSample: (sampleId: string) => void;
  initialSubject?: MbbsSubject;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyze,
  isLoading,
  onLoadSample,
  initialSubject = 'Pharmacology',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [subject, setSubject] = useState<MbbsSubject>(initialSubject);

  useEffect(() => {
    if (initialSubject) {
      setSubject(initialSubject);
    }
  }, [initialSubject]);
  
  // File state
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);

  // Text state
  const [textContent, setTextContent] = useState('');

  // Configuration options
  const [cardFormat, setCardFormat] = useState<CardType | 'mixed'>('mixed');
  const [delimiter, setDelimiter] = useState<DelimiterType>('tab');
  const [targetCount, setTargetCount] = useState<number>(10);
  const [deckName, setDeckName] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Convert File to Base64
  const processFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (!isImage && !isPdf) {
      alert('Please upload an image (JPG, PNG, WebP) or a PDF document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedFile({
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : '',
        base64,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
      });
      if (!deckName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setDeckName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Live Camera handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera stream error, falling back to file picker:', err);
      // Fallback to mobile native camera picker
      cameraInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedFile({
        file: new File([], 'Handwritten_Camera_Photo.jpg', { type: 'image/jpeg' }),
        previewUrl: base64,
        base64,
        mimeType: 'image/jpeg',
      });
      if (!deckName) setDeckName('Handwritten Notes');
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !textContent.trim()) {
      alert('Please upload a photo/PDF or paste your notes to generate flashcards.');
      return;
    }

    await onAnalyze({
      fileData: selectedFile?.base64,
      mimeType: selectedFile?.mimeType,
      fileName: selectedFile?.file.name,
      textContent: textContent.trim(),
      cardFormat,
      delimiter,
      targetCount,
      deckName: deckName.trim(),
      customInstructions: customInstructions.trim(),
      subject,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tab Switcher */}
      <div className="border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Photo / Handwritten / PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'text'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Paste Text or Notes</span>
          </button>
        </div>

        {/* Quick Sample Deck Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[11px] font-medium text-slate-500 shrink-0">
            Quick samples:
          </span>
          {SAMPLE_DECKS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onLoadSample(sample.id)}
              className="text-[11px] px-2 py-1 rounded-md bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-colors whitespace-nowrap shadow-2xs"
            >
              {sample.title.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        {/* Source Input Area */}
        {activeTab === 'upload' ? (
          <div>
            {!selectedFile && !cameraActive ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>

                <h3 className="text-sm font-bold text-slate-800">
                  Upload Photo, Handwritten Notes, or PDF
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Works with notebook handwriting, whiteboard captures, textbook pages, lecture slides, or exam PDFs.
                </p>

                <div className="mt-4 flex flex-wrap justify-center items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                  >
                    Browse Device Files
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Snap with Camera</span>
                  </button>
                </div>
              </div>
            ) : cameraActive ? (
              <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-950 p-4 text-center">
                <div className="relative max-w-md mx-auto aspect-4/3 rounded-xl overflow-hidden bg-black mb-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Snapshot</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Selected File Preview */
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  {selectedFile.previewUrl ? (
                    <img
                      src={selectedFile.previewUrl}
                      alt="Source document"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-red-100 text-red-600 flex flex-col items-center justify-center border border-red-200">
                      <FileText className="w-7 h-7" />
                      <span className="text-[10px] font-bold uppercase mt-0.5">PDF</span>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                      {selectedFile.file.name || 'Captured Photo'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {(selectedFile.file.size / 1024).toFixed(1)} KB •{' '}
                      {selectedFile.mimeType.includes('pdf') ? 'PDF Document' : 'Photo / Handwriting'}
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready for AnkiDroid extraction</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Text Notes Tab */
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Paste Typed Notes, Study Guides, or Syllabus:
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your lecture notes, book summaries, definitions, or OCR text here..."
              rows={6}
              className="w-full text-xs font-sans p-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        )}

        {/* Configuration Grid: MBBS Subject, Card Type, Delimiter, Card Count, Deck Title */}
        <div className="pt-2 border-t border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. MBBS Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>MBBS Subject:</span>
                </span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as MbbsSubject)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {MBBS_SUBJECTS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.phase})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Target subject tab &amp; categorization
              </span>
            </div>

            {/* 2. Card Format */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Card Style:</span>
              </label>
              <select
                value={cardFormat}
                onChange={(e) => setCardFormat(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="mixed">Mixed Smart (Recommended)</option>
                <option value="cloze">Cloze Deletion ({"{{c1::...}}"})</option>
                <option value="basic">Basic (Front & Back Q&A)</option>
                <option value="reversible">Reversible (Two-Way Recall)</option>
                <option value="definition">Key Terms & Definitions</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {cardFormat === 'cloze'
                  ? 'Fills blanks {{c1::...}} for Cloze'
                  : cardFormat === 'mixed'
                  ? 'Combines Cloze & Q&A by content'
                  : 'Traditional Front/Back flashcard'}
              </span>
            </div>

            {/* 3. Delimiter Format */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Delimiter Format:
              </label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value as DelimiterType)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="tab">Tab-Separated (TSV/TXT) ⭐</option>
                <option value="comma">Comma-Separated (CSV)</option>
                <option value="semicolon">Semicolon-Separated (;)</option>
                <option value="colon">Colon-Separated (:)</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {delimiter === 'tab'
                  ? 'Safest for AnkiDroid (handles commas)'
                  : delimiter === 'comma'
                  ? 'RFC CSV with quotes'
                  : `${delimiter === 'semicolon' ? 'Semicolon (;)' : 'Colon (:)'} delimiter`}
              </span>
            </div>

            {/* 4. Target Number of Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Card Count:</span>
                <span className="font-bold text-blue-600 text-xs">{targetCount} cards</span>
              </label>
              <input
                type="range"
                min={5}
                max={25}
                step={5}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full accent-blue-600 mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>5 (Core)</span>
                <span>15 (Balanced)</span>
                <span>25 (Deep)</span>
              </div>
            </div>

            {/* 5. Deck Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Deck Name in AnkiDroid:
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder={`e.g. MBBS::${subject}`}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Auto-saved under {subject}
              </span>
            </div>
          </div>

          {/* Optional Focus Directives */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Custom focus / directives (Optional):
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., 'Focus heavily on formulas and enzyme names', or 'Generate cards in English with Spanish translations'"
              className="w-full text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI extracts atomic facts &amp; auto-injects AnkiDroid import directives</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || (!selectedFile && !textContent.trim())}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing &amp; Generating Cards...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Flashcards</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
