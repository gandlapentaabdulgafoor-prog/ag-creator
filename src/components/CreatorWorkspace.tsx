import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, BookOpen, Check, ChevronDown, Clapperboard,
  Clock3, Copy, Flame, Image as ImageIcon, LoaderCircle, PenLine, Plus,
  Search, Send, Sparkles, Trash2, WandSparkles, Youtube
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CreatorResult, CreatorWorkflow, deleteCreation, generateCreation, getCreations, saveCreation } from '../services/creatorService';

const workflows: { id: CreatorWorkflow; label: string; hint: string; icon: React.ReactNode }[] = [
  { id: 'auto', label: 'Smart create', hint: 'Choose for me', icon: <WandSparkles size={15} /> },
  { id: 'image', label: 'Image', hint: 'Generate artwork', icon: <ImageIcon size={15} /> },
  { id: 'thumbnail', label: 'Thumbnail', hint: 'YouTube 16:9', icon: <Youtube size={15} /> },
  { id: 'image-prompt', label: 'Image prompt', hint: 'Prompt writing', icon: <PenLine size={15} /> },
  { id: 'video-prompt', label: 'Video prompt', hint: 'For video models', icon: <Clapperboard size={15} /> },
  { id: 'seo', label: 'SEO', hint: 'Titles & tags', icon: <Search size={15} /> },
  { id: 'ideas', label: 'Ideas', hint: 'Creator concepts', icon: <Flame size={15} /> },
  { id: 'story', label: 'Story', hint: 'Narrative writing', icon: <BookOpen size={15} /> },
  { id: 'script', label: 'Video script', hint: 'YouTube & more', icon: <Clapperboard size={15} /> },
  { id: 'shorts', label: 'Shorts / Reels', hint: 'Short-form video', icon: <Send size={15} /> },
];

const packStorageKey = `ag-creator-daily-pack-${new Date().toLocaleDateString('en-CA')}`;

export const CreatorWorkspace: React.FC = () => {
  const { currentUser, setAuthModalOpen } = useAuth();
  const [workflow, setWorkflow] = useState<CreatorWorkflow>('auto');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<CreatorResult | null>(null);
  const [history, setHistory] = useState<CreatorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [dailyPackCreated, setDailyPackCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const items = await getCreations();
      setHistory(items.slice(0, 40));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Saved creations could not be loaded.');
    }
  }, []);

  useEffect(() => {
    void loadHistory();
    setDailyPackCreated(Boolean(localStorage.getItem(packStorageKey)));
    fetch('/api/creator/status').then((response) => response.json()).then((status) => setConfigured(Boolean(status.configured))).catch(() => setConfigured(false));
  }, [loadHistory]);

  const selectedWorkflow = useMemo(() => workflows.find((item) => item.id === result?.workflow), [result]);

  const run = async (chosenWorkflow = workflow, chosenInput = input) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      setError('Sign in to generate with AG Creator.');
      return;
    }
    if (!chosenInput.trim()) {
      setError('Start with an idea, topic, or creative direction.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const generated = await generateCreation(currentUser, chosenWorkflow, chosenInput.trim());
      const creation: CreatorResult = { ...generated, id: crypto.randomUUID(), input: chosenInput.trim(), createdAt: new Date().toISOString() };
      setResult(creation);
      if (chosenWorkflow === 'daily-pack') {
        await saveCreation(creation);
        localStorage.setItem(packStorageKey, creation.id);
        setDailyPackCreated(true);
        await loadHistory();
      }
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createDailyPack = () => {
    if (dailyPackCreated) {
      const todayPackId = localStorage.getItem(packStorageKey);
      const savedPack = history.find((item) => item.id === todayPackId);
      if (savedPack) setResult(savedPack);
      else setError('Today’s pack was created on this device already. Find it in Saved creations below.');
      return;
    }
    setWorkflow('daily-pack');
    void run('daily-pack', 'Build today’s practical creator pack for a video creator making useful, engaging content.');
  };

  const saveCurrent = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await saveCreation(result);
      await loadHistory();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'This creation could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadImage = () => {
    if (!result?.image) return;
    const link = document.createElement('a');
    link.href = `data:${result.mimeType || 'image/png'};base64,${result.image}`;
    link.download = `${result.workflow}-${result.id}.png`;
    link.click();
  };

  const restoreCreation = (creation: CreatorResult) => {
    setResult(creation);
    setInput(creation.input);
    setWorkflow(creation.workflow);
    setError('');
  };

  const removeCreation = async (id: string) => {
    await deleteCreation(id);
    if (localStorage.getItem(packStorageKey) === id) {
      localStorage.removeItem(packStorageKey);
      setDailyPackCreated(false);
    }
    setHistory((items) => items.filter((item) => item.id !== id));
    if (result?.id === id) setResult(null);
  };

  return (
    <div className="creator-workspace mx-auto max-w-7xl space-y-8 pb-16 animate-fade-in">
      <section className="relative overflow-hidden rounded-[30px] border border-emerald-500/20 bg-gradient-to-br from-[#111c28] via-slate-950 to-[#15211f] p-7 sm:p-10 shadow-2xl">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Sparkles size={14} /> Your creative desk, powered by AI
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">Make your next<br className="hidden sm:block" /> <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">great thing.</span></h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Bring one idea. AG Creator helps shape it into visuals, scripts, short-form videos, and launch-ready metadata—all from one workspace.</p>
          </div>
          <button onClick={createDailyPack} disabled={loading} className="flex items-center justify-between gap-7 rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] p-4 text-left transition hover:bg-amber-300/[0.12] disabled:opacity-50">
            <span className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200"><Sparkles size={20} /></span><span><span className="block text-sm font-bold text-white">Daily Creator Pack</span><span className="mt-1 block text-xs text-slate-400">{dailyPackCreated ? 'Today’s pack is ready' : 'A fresh idea, script & prompt'}</span></span></span>
            {dailyPackCreated ? <Check size={17} className="text-emerald-300" /> : <ArrowRight size={17} className="text-amber-200" />}
          </button>
        </div>
      </section>

      {configured === false && <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-5 py-4 text-sm text-amber-100"><strong>AI setup needed.</strong> Add <code className="rounded bg-black/20 px-1.5 py-0.5">GEMINI_API_KEY</code> to the server environment to turn on real AI generation. Your key stays on the server.</div>}

      <section className="creator-workspace-content grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="creator-workspace-column space-y-5">
          <div className="creator-input-card rounded-3xl border border-slate-800 bg-slate-900/75 p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Your idea</p><p className="mt-1 text-xs text-slate-500">Choose a workflow or let AG pick one.</p></div><span className="hidden rounded-lg bg-slate-950 px-3 py-2 text-[11px] text-slate-500 sm:inline-flex">AI-assisted creation</span></div>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} placeholder="A cozy, cinematic coffee brand launch for a rainy Sunday morning…" className="creator-idea-input min-h-36 w-full resize-y rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50" />
            <div className="creator-workflow-chips mt-4 flex flex-wrap gap-2">
              {workflows.map((item) => <button key={item.id} onClick={() => setWorkflow(item.id)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${workflow === item.id ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'}`}>{item.icon}{item.label}</button>)}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">{input.length}/2000</span>
              <button onClick={() => void run()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/15 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{loading ? <><LoaderCircle size={16} className="animate-spin" /> Creating…</> : <><Sparkles size={16} /> Create with AG <ArrowRight size={15} /></>}</button>
            </div>
          </div>

          {error && <div role="alert" className="flex items-start justify-between gap-4 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error" className="text-rose-200/70 hover:text-white">×</button></div>}

          <div className="min-h-64 rounded-3xl border border-slate-800 bg-slate-900/50 p-5 sm:p-7">
            {loading ? <div className="flex min-h-52 flex-col items-center justify-center text-center"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><LoaderCircle className="animate-spin" /></span><p className="font-semibold text-white">Shaping your idea…</p><p className="mt-1 text-xs text-slate-500">AG is working on your {workflows.find((item) => item.id === workflow)?.label.toLowerCase() || 'creation'}.</p></div> : result ? <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300"><Sparkles size={14} /> {selectedWorkflow?.label || result.workflow.replace('-', ' ')}</div><h2 className="mt-2 text-xl font-bold text-white">Your creation</h2></div><div className="flex gap-2"><button onClick={() => void copyResult()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy'}</button><button onClick={() => void saveCurrent()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-60">{saving ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />}Save</button><button onClick={() => void run(result.workflow, result.input)} disabled={loading} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">Regenerate</button></div></div>
              {result.image && <div className="mb-5 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950"><img src={`data:${result.mimeType || 'image/png'};base64,${result.image}`} alt="AI generated creator artwork" className="max-h-[560px] w-full object-contain" /><button onClick={downloadImage} className="m-3 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"><ArrowDownToLine size={14} />Download image</button></div>}
              <textarea aria-label="Edit creation" value={result.text} onChange={(event) => setResult({ ...result, text: event.target.value })} className="min-h-64 w-full resize-y rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm leading-7 text-slate-200 outline-none focus:border-emerald-500/40" />
              <p className="mt-3 text-[11px] text-slate-500">Edit the result above, then save it to your creations.</p>
            </> : <div className="flex min-h-52 flex-col items-center justify-center text-center"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400"><WandSparkles /></span><p className="font-semibold text-slate-200">Your next idea starts here</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Describe what you want to make. AG will route it through the right workflow and bring the result back here.</p></div>}
          </div>
        </div>

        <aside className="creator-workspace-column space-y-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-white">Creator workflows</h2><p className="mt-1 text-xs text-slate-500">One workspace. Every format.</p></div><ChevronDown size={16} className="text-slate-500" /></div>
            <div className="space-y-1.5">{workflows.filter((item) => item.id !== 'auto').map((item) => <button key={item.id} onClick={() => { setWorkflow(item.id); document.querySelector('textarea')?.focus(); }} className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-800/75"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-emerald-300 group-hover:bg-emerald-400/10">{item.icon}</span><span className="flex-1"><span className="block text-xs font-semibold text-slate-200">{item.label}</span><span className="mt-0.5 block text-[10px] text-slate-500">{item.hint}</span></span><ArrowRight size={13} className="text-slate-600 group-hover:text-emerald-300" /></button>)}</div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-white">Saved creations</h2><p className="mt-1 text-xs text-slate-500">Stored on this device</p></div><Clock3 size={16} className="text-slate-500" /></div>
            {history.length === 0 ? <p className="rounded-xl bg-slate-950/70 p-4 text-xs leading-5 text-slate-500">Save a result to build your personal creative library.</p> : <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">{history.map((item) => <div key={item.id} className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5"><button onClick={() => restoreCreation(item)} className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-semibold text-slate-200">{item.input}</span><span className="mt-1 block text-[10px] text-slate-500">{item.workflow.replace('-', ' ')} · {new Date(item.createdAt).toLocaleDateString()}</span></button>{item.image && <ImageIcon size={14} className="shrink-0 text-emerald-300" />}<button aria-label="Delete saved creation" onClick={() => void removeCreation(item.id)} className="rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:bg-rose-400/10 hover:text-rose-300 group-hover:opacity-100"><Trash2 size={14} /></button></div>)}</div>}
          </div>
          <p className="px-1 text-[10px] leading-4 text-slate-600">Trending-style ideas are AI generated suggestions, not live trend analytics. Video prompt workflows create prompts and scripts; they do not render a video file.</p>
        </aside>
      </section>
    </div>
  );
};
