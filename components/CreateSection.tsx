
import * as React from 'react';
import { useState, useMemo, useRef } from 'react';
import { Question } from '../types';

interface CreateSectionProps {
  quizData: Question[];
  onAdd: (q: Question) => void;
  onUpdate: (index: number, q: Question) => void;
  onRemove: (index: number) => void;
  onToggleSubject: (subject: string, active: boolean) => void;
  onRemoveSubject: (subject: string) => void;
  onBatchAdd: (qs: Question[]) => void;
  onLogout: () => void;
}

const CreateSection: React.FC<CreateSectionProps> = ({ 
  quizData, 
  onAdd, 
  onUpdate, 
  onRemove, 
  onToggleSubject, 
  onRemoveSubject,
  onBatchAdd, 
  onLogout 
}) => {
  const KHMER_PREFIXES = ['ក', 'ខ', 'គ', 'ឃ'];
  const [entryMode, setEntryMode] = useState<'single' | 'bulk'>('single');
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('ទាំងអស់');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const allSubjects = useMemo(() => Array.from(new Set(quizData.map((q: Question) => q.subject))), [quizData]);

  const subjectsVisibility = useMemo(() => {
    const map: Record<string, boolean> = {};
    quizData.forEach((q: Question) => {
      if (map[q.subject] === undefined) map[q.subject] = q.isActive !== false;
    });
    return map;
  }, [quizData]);

  const filteredQuestions = useMemo(() => {
    return quizData
      .map((q: Question, originalIndex: number) => ({ ...q, originalIndex }))
      .filter((item: any) => {
        const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterSubject === 'ទាំងអស់' || item.subject === filterSubject;
        return matchesSearch && matchesFilter;
      });
  }, [quizData, searchQuery, filterSubject]);

  const handleSubmitSingle = () => {
    if (!subject.trim() || !question.trim() || options.some(o => !o.trim())) {
      alert("សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់!");
      return;
    }
    const newQ: Question = { subject: subject.trim(), question: question.trim(), options: options.map(o => o.trim()), correct, isActive: true };
    if (editingIndex !== null) onUpdate(editingIndex, newQ);
    else onAdd(newQ);
    setQuestion(''); setOptions(['', '', '', '']); setEditingIndex(null);
  };

  const handleExportFullProject = async () => {
    const JSZip = (window as any).JSZip;
    if (!JSZip) { alert("បណ្ណាល័យ ZIP មិនទាន់រួចរាល់!"); return; }
    setIsExporting(true);
    const zip = new JSZip();

    try {
      const projectFiles: Record<string, string> = {
        "package.json": JSON.stringify({
          "name": "khmer-quiz-pro",
          "private": true,
          "version": "1.0.0",
          "type": "module",
          "scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" },
          "dependencies": { "react": "^19.2.3", "react-dom": "^19.2.3" },
          "devDependencies": { "@types/react": "^19.2.3", "@types/react-dom": "^19.2.3", "@vitejs/plugin-react": "^4.3.1", "typescript": "^5.5.2", "vite": "^5.3.1" }
        }, null, 2),
        "tsconfig.json": JSON.stringify({
          "compilerOptions": { "target": "ESNext", "lib": ["DOM", "DOM.Iterable", "ESNext"], "allowJs": false, "skipLibCheck": true, "esModuleInterop": true, "allowSyntheticDefaultImports": true, "strict": true, "module": "ESNext", "moduleResolution": "Node", "resolveJsonModule": true, "isolatedModules": true, "noEmit": true, "jsx": "react-jsx" },
          "include": ["**/*.ts", "**/*.tsx"]
        }, null, 2),
        "vite.config.ts": "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});",
        "index.html": "<!DOCTYPE html>\n<html lang=\"km\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>កម្រងសំណួរពហុចម្លើយ</title>\n    <script src=\"https://cdn.tailwindcss.com\"></script>\n    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js\"></script>\n    <link href=\"https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;500;600;700&display=swap\" rel=\"stylesheet\">\n    <style>body{font-family:'Kantumruy Pro',sans-serif;margin:0;padding:0;background-image:linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)),url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=2500');background-size:cover;background-position:center;background-attachment:fixed;min-height:100vh;}.heading-kh{font-weight:700;}.text-maroon{color:#800000;}.bg-maroon{background-color:#800000;}.glass-card{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.5);box-shadow:0 15px 35px rgba(0,0,0,0.25);}</style>\n</head>\n<body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/index.tsx\"></script>\n</body>\n</html>",
        "types.ts": "export interface Question { subject: string; question: string; options: string[]; correct: number; isActive?: boolean; }\nexport type AppMode = 'play' | 'create';\nexport interface QuizState { currentQuestionIndex: number; score: number; isFinished: boolean; selectedAnswer: number | null; showCorrect: boolean; }\nexport interface SelectedQuizInfo { subject: string; partIndex: number; }",
        "constants.ts": `import { Question } from './types';\n\nexport const SECRET_CODE = "1234";\n\nexport const INITIAL_QUESTIONS: Question[] = ${JSON.stringify(quizData, null, 2)};`,
        "metadata.json": JSON.stringify({ "name": "Quiz Master Pro", "description": "Khmer Quiz Application" }, null, 2)
      };

      Object.entries(projectFiles).forEach(([path, content]) => zip.file(path, content));

      const sourcePaths = ["index.tsx", "App.tsx", "components/Header.tsx", "components/AuthSection.tsx", "components/CreateSection.tsx", "components/PlaySection.tsx", "components/QuizGame.tsx", "components/LoadingOverlay.tsx"];
      
      for (const path of sourcePaths) {
        try {
          const res = await fetch(path);
          if (res.ok) {
            zip.file(path, await res.text());
          }
        } catch (e) { }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Khmer_Quiz_Full_Source.zip`;
      link.click();
    } catch (e) {
      alert("កំហុសក្នុងការបង្កើត ZIP");
    } finally {
      setIsExporting(false);
    }
  };

  const parsePlainText = (text: string, defaultSubject: string): Question[] => {
    const questions: Question[] = [];
    const blocks = text.trim().split(/\n\s*\n/);
    blocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l !== '');
      if (lines.length < 2) return;
      let questionText = lines[0].replace(/^[\s\d០-៩a-zA-Z-IVX]+\s*[\.\)]\s*/i, '');
      const opts: string[] = [];
      let correctIdx = 0;
      const optionRegex = /^([កខគឃA-D])[\.\)]\s*(.*)/i;
      lines.slice(1).forEach(line => {
        const match = line.match(optionRegex);
        if (match) {
          let content = match[2].trim();
          if (content.includes('(ចម្លើយត្រឹមត្រូវ)')) { correctIdx = opts.length; content = content.replace('(ចម្លើយត្រឹមត្រូវ)', '').trim(); }
          opts.push(content);
        } else if (opts.length > 0) opts[opts.length - 1] += " " + line;
      });
      if (opts.length > 0) {
        const finalOpts = [...opts]; while (finalOpts.length < 4) finalOpts.push("");
        questions.push({ subject: defaultSubject || 'ទូទៅ', question: questionText, options: finalOpts.slice(0, 4), correct: correctIdx, isActive: true });
      }
    });
    return questions;
  };

  const handleBulkAdd = () => {
    if (!bulkText.trim()) return;
    let newQuestions: Question[] = [];
    if (bulkText.trim().startsWith('[') || bulkText.trim().startsWith('{')) {
      try { newQuestions = JSON.parse(bulkText); } catch (e) { alert("JSON Error"); return; }
    } else { newQuestions = parsePlainText(bulkText, bulkSubject); }
    if (newQuestions.length > 0) { onBatchAdd(newQuestions); setBulkText(''); alert(`បានបញ្ចូល ${newQuestions.length} សំណួរ!`); }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-white/50 text-center flex flex-col justify-center">
          <p className="text-[10px] text-gray-500 uppercase font-bold small-kh mb-1">សំណួរសរុប</p>
          <p className="text-2xl font-black text-maroon">{quizData.length}</p>
        </div>
        <button onClick={handleExportFullProject} disabled={isExporting} className="glass-card p-4 rounded-2xl border-2 border-indigo-200 text-center hover:bg-indigo-600 hover:text-white transition-all group">
          <p className="text-[10px] uppercase font-bold small-kh mb-1">ទាញយក Code</p>
          <span className="text-2xl block">{isExporting ? '⏳' : '🚀'}</span>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="glass-card p-4 rounded-2xl border border-white/50 text-center hover:bg-green-50 transition-all">
          <input type="file" ref={fileInputRef} onChange={(e) => {
            const file = e.target.files?.[0]; if (!file) return;
            const reader = new FileReader(); reader.onload = (ev) => { try { onBatchAdd(JSON.parse(ev.target?.result as string)); } catch(e){ alert("File Error"); } };
            reader.readAsText(file);
          }} accept=".json" className="hidden" />
          <p className="text-[10px] text-green-700 uppercase font-bold small-kh mb-1">បញ្ចូល JSON</p>
          <span className="text-2xl block">📤</span>
        </button>
        <button onClick={onLogout} className="glass-card p-4 rounded-2xl border border-white/50 text-center hover:bg-red-50 transition-all">
          <p className="text-[10px] text-red-400 uppercase font-bold small-kh mb-1">ចាកចេញ</p>
          <span className="text-2xl block">🚪</span>
        </button>
      </div>

      <div ref={formRef} className="glass-card rounded-3xl shadow-lg p-8 border border-white/50 overflow-hidden">
        <div className="flex border-b border-gray-100 mb-8 -mx-8 px-8">
          <button onClick={() => setEntryMode('single')} className={`pb-4 px-6 font-bold heading-kh text-sm transition-all border-b-4 ${entryMode === 'single' ? 'border-maroon text-maroon' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>ម្ដងមួយៗ</button>
          <button onClick={() => setEntryMode('bulk')} className={`pb-4 px-6 font-bold heading-kh text-sm transition-all border-b-4 ${entryMode === 'bulk' ? 'border-maroon text-maroon' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>ម្ដងទាំងអស់</button>
        </div>
        {entryMode === 'single' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold heading-kh text-maroon">{editingIndex !== null ? '✏️ កែសម្រួល' : '✍️ បង្កើតថ្មី'}</h2>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-maroon small-kh font-bold" placeholder="មុខវិជ្ជា" />
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-maroon outline-none min-h-[100px] small-kh" placeholder="បញ្ចូលសំណួរ..." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100">
                  <span className="font-bold text-indigo-900 w-6 text-center">{KHMER_PREFIXES[i]}</span>
                  <input type="text" value={opt} onChange={(e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} className="flex-1 outline-none small-kh py-2" placeholder={`ជម្រើស ${KHMER_PREFIXES[i]}`} />
                  <input type="radio" checked={correct === i} onChange={() => setCorrect(i)} className="accent-green-500 w-5 h-5 cursor-pointer" />
                </div>
              ))}
            </div>
            <button onClick={handleSubmitSingle} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow-lg">រក្សាទុក</button>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold heading-kh text-maroon">🚀 Smart Bulk Import</h2>
            <input type="text" value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none small-kh font-bold" placeholder="មុខវិជ្ជា" />
            <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full px-4 py-4 rounded-2xl border border-gray-100 min-h-[300px] small-kh text-sm bg-gray-50" placeholder="១. សំណួរ?&#10;ក. ចម្លើយ (ចម្លើយត្រឹមត្រូវ)..." />
            <button 
              onClick={handleBulkAdd} 
              className="w-full bg-maroon hover:bg-maroon-dark text-white font-black py-4 rounded-xl shadow-xl transition-all active:scale-[0.98]"
            >
              បញ្ចូលទាំងអស់
            </button>
          </div>
        )}
      </div>

      <div className="glass-card rounded-3xl shadow-lg p-8 border border-white/50">
        <h3 className="text-lg font-bold mb-4 heading-kh text-maroon">👁️ បើក/បិទ និងលុបមុខវិជ្ជា</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(subjectsVisibility).map(([subName, isActive]) => (
            <div key={subName} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="font-bold text-gray-700 heading-kh text-sm truncate pr-4">{subName}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => onToggleSubject(subName, !isActive)} 
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}
                >
                  {isActive ? 'បង្ហាញ' : 'បិទ'}
                </button>
                <button 
                  onClick={() => onRemoveSubject(subName)} 
                  className="px-3 py-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase"
                >
                  លុប
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-3xl shadow-lg p-8 border border-white/50">
        <h3 className="text-lg font-bold mb-4 heading-kh text-maroon">📚 បញ្ជីសំណួរ ({quizData.length})</h3>
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ស្វែងរក..." className="w-full px-5 py-3 rounded-2xl border border-gray-100 outline-none small-kh mb-4" />
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredQuestions.map((item: any) => (
            <div key={item.originalIndex} className="p-4 bg-white rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
              <div className="truncate flex-1 pr-4">
                <span className="text-[10px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-md mr-2">{item.subject}</span>
                <p className="text-sm font-medium text-gray-800 truncate small-kh inline">{item.question}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => { setSubject(item.subject); setQuestion(item.question); setOptions(item.options); setCorrect(item.correct); setEditingIndex(item.originalIndex); setEntryMode('single'); formRef.current?.scrollIntoView({ behavior: 'smooth' }); }} className="p-2 bg-orange-50 text-orange-400 rounded-lg">✏️</button>
                <button onClick={() => { if(confirm("លុប?")) onRemove(item.originalIndex); }} className="p-2 bg-red-50 text-red-400 rounded-lg">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateSection;
