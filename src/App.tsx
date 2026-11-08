import React, { useState, useEffect, useRef, useCallback } from 'react';

// Prebuilt Gemini TTS voices with avatar indicators and descriptions
const VOICES = [
  { name: 'Iapetus', gender: 'M', tone: 'Net & Güvenilir', accent: 'US', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Achird', gender: 'F', tone: 'Samimi & Doğal', accent: 'US', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Erinome', gender: 'F', tone: 'Net & Öğretici', accent: 'US', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Charon', gender: 'M', tone: 'Bilgilendirici', accent: 'UK', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Kore', gender: 'F', tone: 'Kararlı & Canlı', accent: 'US', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Orus', gender: 'M', tone: 'Kararlı', accent: 'US', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Alnilam', gender: 'M', tone: 'Resmi', accent: 'US', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Schedar', gender: 'F', tone: 'Dengeli', accent: 'US', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Sadaltager', gender: 'M', tone: 'Bilgili', accent: 'UK', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Sulafat', gender: 'F', tone: 'Sıcak', accent: 'US', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Vindemiatrix', gender: 'F', tone: 'Nazik & Kibar', accent: 'US', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Achernar', gender: 'M', tone: 'Yumuşak', accent: 'US', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Algieba', gender: 'M', tone: 'Akıcı', accent: 'US', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Despina', gender: 'F', tone: 'Akıcı', accent: 'US', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Zephyr', gender: 'F', tone: 'Parlak', accent: 'US', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Puck', gender: 'M', tone: 'Neşeli', accent: 'US', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Callirrhoe', gender: 'F', tone: 'Rahat', accent: 'US', avatar: 'https://images.unsplash.com/photo-1534751516642-a171edd2521b?w=96&h=96&fit=crop&crop=faces' },
  { name: 'Fenrir', gender: 'M', tone: 'Heyecanlı', accent: 'US', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=96&h=96&fit=crop&crop=faces' },
] as const;

// Emotion & Delivery Style Presets
const EMOTION_PRESETS = [
  { id: 'Conversational', label: 'Conversational', emoji: '😄', desc: 'Doğal & Sohbet Tonu' },
  { id: 'Educational', label: 'Teacher / Calm', emoji: '👩‍🏫', desc: 'Sakin Öğretici Ton' },
  { id: 'News', label: 'News Anchor', emoji: '🎙️', desc: 'Net & Resmi' },
  { id: 'Storyteller', label: 'Storyteller', emoji: '📖', desc: 'Vurgulu Anlatım' },
  { id: 'Cheerful', label: 'Cheerful', emoji: '✨', desc: 'Canlı & Neşeli' },
  { id: 'Whispering', label: 'Soft / Intimate', emoji: '🤫', desc: 'Fısıltılı & Yumuşak' },
];

const ACCENTS = [
  { id: 'US', label: 'US American', flag: '🇺🇸' },
  { id: 'UK', label: 'British', flag: '🇬🇧' },
  { id: 'AU', label: 'Australian', flag: '🇦🇺' },
  { id: 'CA', label: 'Canadian', flag: '🇨🇦' },
];

interface SpeakerConfig {
  id: number;
  name: string;
  voice: string;
  gender: 'M' | 'F';
  accent: string;
  emotion: string;
  pitch: number; // percentage (-50% to +50%)
  speed: number; // percentage (-50% to +50%)
  variability: number; // percentage (0% to 100%)
  instruction: string;
}

const DEFAULT_SPEAKERS: SpeakerConfig[] = [
  {
    id: 1,
    name: '1. Konuşmacı',
    voice: 'Puck', // Erkek (US)
    gender: 'M',
    accent: 'US',
    emotion: 'Educational',
    pitch: 0,
    speed: -25, // default slightly slower for clear exam listening
    variability: 40,
    instruction: 'Read slowly and clearly, like a friendly English teacher',
  },
  {
    id: 2,
    name: '2. Konuşmacı',
    voice: 'Kore', // Kadın (US)
    gender: 'F',
    accent: 'US',
    emotion: 'Conversational',
    pitch: 0,
    speed: -15,
    variability: 55,
    instruction: 'Say naturally and clearly, like a friendly person answering in a dialogue',
  },
  {
    id: 3,
    name: '3. Konuşmacı',
    voice: 'Zephyr', // Kadın (US)
    gender: 'F',
    accent: 'US',
    emotion: 'Conversational',
    pitch: 0,
    speed: -15,
    variability: 50,
    instruction: 'Clear, engaging, articulate and warm tone',
  },
  {
    id: 4,
    name: '4. Konuşmacı',
    voice: 'Charon', // Erkek (UK)
    gender: 'M',
    accent: 'UK',
    emotion: 'Conversational',
    pitch: 0,
    speed: -15,
    variability: 45,
    instruction: 'Natural British accent with clear enunciation',
  },
  {
    id: 5,
    name: '5. Konuşmacı',
    voice: 'Fenrir', // Erkek (US)
    gender: 'M',
    accent: 'US',
    emotion: 'Cheerful',
    pitch: 0,
    speed: -10,
    variability: 60,
    instruction: 'Lively, friendly and pleasant tone',
  },
];

interface Segment {
  spk: number; // 1 | 2 | 3 | 4 | 5
  text: string;
  clip?: Float32Array | null;
}

interface ItemPart {
  kind: 's1' | 's2' | 's3' | 's4' | 's5' | 'si';
  s: Float32Array;
}

interface QuestionItem {
  n: number;
  segs: Segment[];
  numClip: Float32Array | null;
  speed?: number; // per-question speed override (e.g. -25%, -15%, +10%)
  ready: boolean;
  status: string;
  st: 'ready' | 'busy' | 'fail' | '';
}

interface ToastMessage {
  id: number;
  text: string;
  isError: boolean;
}

const DEFAULT_EDITOR_HTML = [
  '&lt;speak&gt;',
  '  &lt;prosody rate="0.95"&gt;',
  '1. &lt;break time="1s"/&gt; Look at this coat. Do you like it? <b>Yes, I do. How much is it?</b> It is seventy dollars. What is the price of the coat? &lt;break time="10s"/&gt;&lt;break time="10s"/&gt;',
  '2. &lt;break time="1s"/&gt; The sergeant is going outside the building. What must he do? &lt;break time="10s"/&gt;&lt;break time="10s"/&gt;',
  '3. &lt;break time="1s"/&gt; Samuel is going to a party. What can he wear? &lt;break time="10s"/&gt;&lt;break time="10s"/&gt;',
  '4. &lt;break time="1s"/&gt; It is cold. What is Karl doing? &lt;break time="10s"/&gt;&lt;break time="10s"/&gt;',
  '5. &lt;break time="1s"/&gt; Can dogs fly? No, but they can run. What can fish do? &lt;break time="10s"/&gt;&lt;break time="10s"/&gt;',
  '6. &lt;break time="1s"/&gt; It is a very hot and sunny day. Jeff is going swimming. What season is it? &lt;break time="10s"/&gt;&lt;break time="10s"/&gt;',
  '7. &lt;break time="1s"/&gt; What are these on the desk? &lt;break time="10s"/&gt;&lt;break time="10s"/&gt;',
  '8. &lt;break time="1s"/&gt; My family will go to London in October. When will they go there? &lt;break time="10s"/&gt;&lt;break time="10s"/&gt;',
  '9. &lt;break time="1s"/&gt; Tomorrow is Thursday. Yesterday was Tuesday. What is today? &lt;break time="10s"/&gt;&lt;break time="10s"/&gt;',
  '10. &lt;break time="1s"/&gt; This month is May. What is the next month? &lt;break time="10s"/&gt;&lt;break time="10s"/&gt;',
  '  &lt;/prosody&gt;',
  '&lt;/speak&gt;',
]
  .map((l) => `<div>${l.replace(/\[\[(.*?)\]\]/g, '<b>$1</b>')}</div>`)
  .join('');

const MASTER_RATE = 24000;

// Audio processing functions
function b64ToSamples(b64: string): { samples: Float32Array; rate: number } {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  const dv = new DataView(bytes.buffer);

  if (
    len >= 44 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === 'RIFF' &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WAVE'
  ) {
    let offset = 12;
    let sampleRate = 24000;
    let dataOffset = 44;
    let dataLength = len - 44;

    while (offset < len - 8) {
      const chunkId = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );
      const chunkSize = dv.getUint32(offset + 4, true);
      if (chunkId === 'fmt ') {
        sampleRate = dv.getUint32(offset + 12, true);
      } else if (chunkId === 'data') {
        dataOffset = offset + 8;
        dataLength = Math.min(chunkSize, len - dataOffset);
        break;
      }
      offset += 8 + chunkSize;
    }

    const sampleCount = Math.floor(dataLength / 2);
    const samples = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      samples[i] = dv.getInt16(dataOffset + i * 2, true) / 32768;
    }
    return { samples, rate: sampleRate };
  } else {
    const sampleCount = Math.floor(len / 2);
    const samples = new Float32Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      samples[i] = dv.getInt16(i * 2, true) / 32768;
    }
    return { samples, rate: 24000 };
  }
}

// Universal decoder: handles native WAV decoding and browser AudioContext MP3 decoding
async function decodeAudioClip(b64: string): Promise<{ samples: Float32Array; rate: number }> {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i);
  }

  // 1. If standard RIFF WAVE, decode directly
  if (
    len >= 44 &&
    String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) === 'RIFF' &&
    String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) === 'WAVE'
  ) {
    return b64ToSamples(b64);
  }

  // 2. Decode MP3 / compressed audio with browser's native AudioContext
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioContextClass) {
    const ctx = new AudioContextClass();
    try {
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      const channelData = audioBuffer.getChannelData(0);
      const samples = new Float32Array(channelData.length);
      samples.set(channelData);
      return { samples, rate: audioBuffer.sampleRate };
    } catch (err) {
      console.warn('AudioContext decode failed, falling back to raw decode:', err);
    } finally {
      if (ctx.state !== 'closed' && typeof ctx.close === 'function') {
        ctx.close().catch(() => {});
      }
    }
  }

  return b64ToSamples(b64);
}

function trimSilence(buf: Float32Array, rate: number): Float32Array {
  const threshold = 0.012;
  const pad = Math.round(rate * 0.08);
  let s = 0;
  let e = buf.length - 1;
  while (s < buf.length && Math.abs(buf[s]) < threshold) s++;
  while (e > s && Math.abs(buf[e]) < threshold) e--;
  return buf.slice(Math.max(0, s - pad), Math.min(buf.length, e + pad));
}

function resample(buf: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buf;
  const ratio = fromRate / toRate;
  const n = Math.round(buf.length / ratio);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * ratio;
    const j = Math.floor(x);
    const f = x - j;
    out[i] = (buf[j] || 0) * (1 - f) + (buf[j + 1] || 0) * f;
  }
  return out;
}

function silence(sec: number, rate: number = MASTER_RATE): Float32Array {
  return new Float32Array(Math.max(0, Math.round(sec * rate)));
}

function concat(parts: Float32Array[]): Float32Array {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Float32Array(n);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function wavBlob(samples: Float32Array, rate: number = MASTER_RATE): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const dv = new DataView(buf);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  dv.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true); // Mono
  dv.setUint32(24, rate, true);
  dv.setUint32(28, rate * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  writeStr(36, 'data');
  dv.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    dv.setInt16(44 + i * 2, v < 0 ? v * 32768 : v * 32767, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

const fmtTime = (s: number) => {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function App() {
  // Model selection (gemini-3.8-flash-lite-tts offers high throughput and maximum free quota)
  const [model, setModel] = useState('gemini-3.8-flash-lite-tts');
  const [availableModels, setAvailableModels] = useState<string[]>([
    'gemini-3.8-flash-lite-tts',
    'gemini-3.8-flash-tts',
    'gemini-2.5-flash-preview-tts',
  ]);

  // 5 Speakers Configurations (Kadın & Erkek seçenekleri)
  const [speakers, setSpeakers] = useState<SpeakerConfig[]>(DEFAULT_SPEAKERS);
  const [activeSpeakerTab, setActiveSpeakerTab] = useState<number>(1);
  const [showAllSpeakers, setShowAllSpeakers] = useState<boolean>(true);

  // Helper to update any speaker
  const updateSpeaker = useCallback((id: number, updater: Partial<SpeakerConfig> | ((prev: SpeakerConfig) => SpeakerConfig)) => {
    setSpeakers((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (typeof updater === 'function') return updater(s);
        return { ...s, ...updater };
      })
    );
  }, []);

  const spk1 = speakers[0] || DEFAULT_SPEAKERS[0];
  const spk2 = speakers[1] || DEFAULT_SPEAKERS[1];

  // Popover state for Pitch / Speed / Variability sliders
  const [activePopover, setActivePopover] = useState<{
    spk: number;
    type: 'pitch' | 'speed' | 'variability' | 'instruction';
  } | null>(null);

  // Popover state for individual question speed adjustment
  const [activeItemSpeedPopover, setActiveItemSpeedPopover] = useState<number | null>(null);

  // Timing controls (in seconds)
  const [leadTime, setLeadTime] = useState(2.0);
  const [gapTime, setGapTime] = useState(1.0);
  const [turnTime, setTurnTime] = useState(0.5);
  const [afterTime, setAfterTime] = useState(20.0);
  const [numTpl, setNumTpl] = useState('');

  // Connection & API State
  const [connStatus, setConnStatus] = useState<'connected' | 'testing' | 'error'>('testing');
  const [connText, setConnText] = useState('Gemini TTS Bağlanıyor…');

  // Question Items & Output
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [mergedSamples, setMergedSamples] = useState<Float32Array | null>(null);
  const [tapeSegments, setTapeSegments] = useState<
    Array<{ kind: 's1' | 's2' | 's3' | 's4' | 's5' | 'si'; length: number }>
  >([]);
  const [qCountText, setQCountText] = useState('0 soru');
  const [estDuration, setEstDuration] = useState('–');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressText, setProgressText] = useState('Hazır');

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, Float32Array>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  const showToast = useCallback((text: string, isError = false) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, isError }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, isError ? 6000 : 3500);
  }, []);

  // Check API status on startup
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await fetch('/api/tts/status');
        const data = await res.json();
        if (!isMounted) return;
        if (data.ok) {
          setConnStatus('connected');
          setConnText('Gemini TTS Bağlı');
          if (data.models && Array.isArray(data.models)) {
            setAvailableModels(data.models.map((m: any) => m.id));
          }
        } else {
          setConnStatus('error');
          setConnText('Bağlantı Hatası');
        }
      } catch (e: any) {
        if (!isMounted) return;
        setConnStatus('error');
        setConnText('Sunucuya ulaşılamadı');
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize audio elements
  useEffect(() => {
    mainAudioRef.current = new Audio();
    previewAudioRef.current = new Audio();

    const ma = mainAudioRef.current;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(ma.currentTime);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    ma.addEventListener('play', onPlay);
    ma.addEventListener('pause', onPause);
    ma.addEventListener('timeupdate', onTimeUpdate);
    ma.addEventListener('ended', onEnded);

    return () => {
      ma.pause();
      ma.removeEventListener('play', onPlay);
      ma.removeEventListener('pause', onPause);
      ma.removeEventListener('timeupdate', onTimeUpdate);
      ma.removeEventListener('ended', onEnded);
    };
  }, []);

  // Initialize editor text
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = DEFAULT_EDITOR_HTML;
      scheduleParseAndEstimate();
    }
  }, []);

  // Parse lines from editor supporting up to 5 speakers
  const readEditorLines = useCallback((): Array<Array<{ text: string; spk: number }>> => {
    if (!editorRef.current) return [];
    const lines: Array<Array<{ text: string; spk: number }>> = [[]];
    const nl = () => lines.push([]);
    const push = (text: string, spk: number) => {
      text.split('\n').forEach((p, i) => {
        if (i > 0) nl();
        if (p) lines[lines.length - 1].push({ text: p, spk });
      });
    };
    const walk = (node: Node, currentSpk: number) => {
      if (node.nodeType === 3) {
        push(node.nodeValue || '', currentSpk);
        return;
      }
      if (node.nodeType !== 1) return;
      const el = node as HTMLElement;
      const tag = el.tagName;
      if (tag === 'BR') {
        nl();
        return;
      }
      let spk = currentSpk;
      const dataSpk = el.getAttribute('data-spk');
      if (dataSpk && /^[1-5]$/.test(dataSpk)) {
        spk = parseInt(dataSpk, 10);
      } else if (el.classList.contains('spk-1') || el.classList.contains('spk1')) {
        spk = 1;
      } else if (el.classList.contains('spk-2') || el.classList.contains('spk2')) {
        spk = 2;
      } else if (el.classList.contains('spk-3') || el.classList.contains('spk3')) {
        spk = 3;
      } else if (el.classList.contains('spk-4') || el.classList.contains('spk4')) {
        spk = 4;
      } else if (el.classList.contains('spk-5') || el.classList.contains('spk5')) {
        spk = 5;
      } else if (tag === 'B' || tag === 'STRONG') {
        spk = 2;
      } else {
        const fw = el.style ? el.style.fontWeight : '';
        if (fw === 'bold' || parseInt(fw, 10) >= 600) {
          spk = 2;
        }
      }
      const isBlock = /^(DIV|P|LI)$/.test(tag);
      if (isBlock && lines[lines.length - 1].length) nl();
      node.childNodes.forEach((c) => walk(c, spk));
      if (isBlock) nl();
    };
    editorRef.current.childNodes.forEach((c) => walk(c, 1));
    return lines.filter((l) => l.length > 0);
  }, []);

  const parseLineToSegments = useCallback(
    (runs: Array<{ text: string; spk: number }>) => {
      let s = '';
      const spkArray: number[] = [];
      let md = false;
      for (const r of runs) {
        r.text.split('**').forEach((p, i) => {
          if (i > 0) md = !md;
          s += p;
          for (let k = 0; k < p.length; k++) {
            spkArray.push(md ? 2 : r.spk);
          }
        });
      }

      const keep = new Array(s.length).fill(true);

      // Strip HTML tags (<break...>, etc.)
      s.replace(/<[^>]*>/g, (m, off) => {
        for (let i = off; i < off + m.length; i++) keep[i] = false;
        return m;
      });

      // Parse and strip bracket speaker tags like [S1], [S2], [S3], [S4], [S5] or [K1]..[K5]
      s.replace(/\[\s*(?:S|K|Konuşmacı|Speaker)\s*([1-5])\s*\]/gi, (m, spkNum, off) => {
        const targetSpk = parseInt(spkNum, 10);
        for (let i = off; i < off + m.length; i++) keep[i] = false;
        // Propagate targetSpk to subsequent characters until another tag is encountered
        for (let i = off + m.length; i < s.length; i++) {
          spkArray[i] = targetSpk;
        }
        return m;
      });

      // Also strip closing tags like [/S1], [/S2], etc.
      s.replace(/\[\s*\/\s*(?:S|K|Konuşmacı|Speaker)?\s*[1-5]?\s*\]/gi, (m, off) => {
        for (let i = off; i < off + m.length; i++) keep[i] = false;
        return m;
      });

      // Strip question number prefix e.g. "1." or "1)"
      const idx: number[] = [];
      for (let i = 0; i < s.length; i++) {
        if (keep[i]) idx.push(i);
      }
      const cleanPrefix = idx.map((i) => s[i]).join('');
      const numMatch = cleanPrefix.match(/^\s*\d+\s*[.)]\s*/);
      if (numMatch) {
        for (let j = 0; j < numMatch[0].length; j++) {
          keep[idx[j]] = false;
        }
      }

      const segs: Segment[] = [];
      let cur: Segment | null = null;
      for (let i = 0; i < s.length; i++) {
        if (!keep[i]) {
          if (cur) cur.text += ' ';
          continue;
        }
        const spk = spkArray[i] || 1;
        if (!cur || cur.spk !== spk) {
          cur = { spk, text: '' };
          segs.push(cur);
        }
        cur.text += s[i];
      }

      segs.forEach((x) => (x.text = x.text.replace(/\s+/g, ' ').trim()));
      const out: Segment[] = [];
      for (const x of segs) {
        if (!x.text) continue;
        const hasWord = /[\p{L}\p{N}]/u.test(x.text);
        const prev = out[out.length - 1];
        if (prev && (!hasWord || prev.spk === x.spk)) {
          prev.text = (prev.text + (/^[.,!?;:]/.test(x.text) ? '' : ' ') + x.text).trim();
          continue;
        }
        if (!hasWord && !prev) continue;
        out.push({ spk: x.spk, text: x.text });
      }
      return { segs: out, raw: s };
    },
    []
  );

  const parseAll = useCallback(() => {
    const rawLines = readEditorLines();
    const parsedItems: Segment[][] = [];
    let timing: { gap: number; after: number } | null = null;

    for (const runs of rawLines) {
      const { segs, raw } = parseLineToSegments(runs);
      if (!segs.length) continue;
      if (!timing && /<\s*break/i.test(raw)) {
        let g = 0;
        let t = 0;
        let seen = false;
        for (const tok of raw.split(/(<[^>]+>)/)) {
          const br = tok.match(/<\s*break[^>]*time\s*=\s*"([^"]+)"/i);
          if (br) {
            const m = String(br[1])
              .trim()
              .match(/^([\d.]+)\s*(ms|s)?$/i);
            const val = m
              ? (m[2] || 's').toLowerCase() === 'ms'
                ? parseFloat(m[1]) / 1000
                : parseFloat(m[1])
              : 0;
            if (seen) t += val;
            else g += val;
            continue;
          }
          if (tok.startsWith('<')) continue;
          if (tok.replace(/^\s*\d+\s*[.)]\s*/, '').replace(/\*\*/g, '').trim()) {
            seen = true;
            t = 0;
          }
        }
        timing = { gap: g, after: t };
      }
      parsedItems.push(segs);
    }
    return { items: parsedItems, timing };
  }, [readEditorLines, parseLineToSegments]);

  // Estimate duration
  const scheduleParseAndEstimate = useCallback(() => {
    const r = parseAll();
    const multiCount = r.items.filter((s) => s.some((x) => x.spk > 1)).length;
    setQCountText(`${r.items.length} soru` + (multiCount ? ` · ${multiCount} çok sesli diyalog` : ''));

    if (mergedSamples) return;
    const hasNum = !!numTpl.trim();
    let t = leadTime;
    for (const segs of r.items) {
      const words = segs.reduce((a, s) => a + s.text.split(/\s+/).filter(Boolean).length, 0);
      t += words / 2.4 + (hasNum ? 1 + gapTime : 0) + turnTime * (segs.length - 1) + afterTime;
    }
    setEstDuration(r.items.length ? '~' + fmtTime(t) : '–');
  }, [parseAll, mergedSamples, numTpl, leadTime, gapTime, turnTime, afterTime]);

  useEffect(() => {
    scheduleParseAndEstimate();
  }, [leadTime, gapTime, turnTime, afterTime, numTpl, scheduleParseAndEstimate]);

  // Audio item helpers
  const getItemParts = useCallback(
    (it: QuestionItem): ItemPart[] => {
      const parts: ItemPart[] = [];
      if (it.numClip) {
        parts.push({ kind: 's1', s: it.numClip });
        if (gapTime > 0) parts.push({ kind: 'si', s: silence(gapTime) });
      }
      it.segs.forEach((s, idx) => {
        if (idx > 0 && turnTime > 0) parts.push({ kind: 'si', s: silence(turnTime) });
        if (s.clip) {
          const spkNum = Math.min(5, Math.max(1, s.spk || 1));
          const kind = `s${spkNum}` as 's1' | 's2' | 's3' | 's4' | 's5';
          parts.push({ kind, s: s.clip });
        }
      });
      return parts;
    },
    [gapTime, turnTime]
  );

  const getItemSamples = useCallback(
    (it: QuestionItem): Float32Array => {
      return concat(getItemParts(it).map((p) => p.s));
    },
    [getItemParts]
  );

  // Draw Waveform on Canvas with 5 speaker colors
  const drawWave = useCallback((canvas: HTMLCanvasElement, parts: ItemPart[]) => {
    const dpr = window.devicePixelRatio || 1;
    const W = 120;
    const H = 30;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const total = parts.reduce((a, p) => a + p.s.length, 0);
    if (!total) return;

    const bars = 40;
    const step = total / bars;
    const bw = W / bars;
    const computedStyles = getComputedStyle(document.documentElement);
    const colMap: Record<string, string> = {
      s1: computedStyles.getPropertyValue('--spk1').trim() || '#2459C4',
      s2: computedStyles.getPropertyValue('--spk2').trim() || '#8A4CD6',
      s3: computedStyles.getPropertyValue('--spk3').trim() || '#059669',
      s4: computedStyles.getPropertyValue('--spk4').trim() || '#D97706',
      s5: computedStyles.getPropertyValue('--spk5').trim() || '#E11D48',
      si: computedStyles.getPropertyValue('--line').trim() || '#D5DCE4',
    };

    let pi = 0;
    let off = 0;
    for (let b = 0; b < bars; b++) {
      const start = Math.floor(b * step);
      const end = Math.floor((b + 1) * step);
      let peak = 0;
      let kind = 'si';
      for (let i = start; i < end; i += 8) {
        while (pi < parts.length - 1 && i >= off + parts[pi].s.length) {
          off += parts[pi].s.length;
          pi++;
        }
        const v = Math.abs(parts[pi]?.s[i - off] || 0);
        if (v > peak) {
          peak = v;
          kind = parts[pi]?.kind || 'si';
        }
      }
      const h = Math.max(2, Math.min(H, peak * H * 1.6));
      ctx.fillStyle = colMap[kind] || colMap.s1;
      ctx.fillRect(b * bw + 0.5, (H - h) / 2, bw - 1.5, h);
    }
  }, []);

  // Update canvas waveforms whenever items change
  useEffect(() => {
    items.forEach((it) => {
      const canvas = canvasRefs.current.get(it.n);
      if (canvas && it.ready) {
        drawWave(canvas, getItemParts(it));
      }
    });
  }, [items, getItemParts, drawWave]);

  // TTS Fetch with speed, pitch, emotion and variability fine-tuning for any speaker 1-5
  const fetchTts = useCallback(
    async (
      text: string,
      spk: number,
      force = false,
      onWait?: (sec: number) => void,
      speedOverride?: number
    ): Promise<Float32Array> => {
      const cfg = speakers.find((s) => s.id === spk) || speakers[0] || DEFAULT_SPEAKERS[0];
      const voice = cfg.voice;
      const style = cfg.instruction;
      const speed = speedOverride !== undefined ? speedOverride : cfg.speed;
      const pitch = cfg.pitch;
      const emotion = cfg.emotion;
      const variability = cfg.variability;

      const cacheKey = [model, voice, style, speed, pitch, emotion, variability, text].join('|');

      if (!force && audioCache.current.has(cacheKey)) {
        return audioCache.current.get(cacheKey)!;
      }

      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const res = await fetch('/api/tts/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              voice,
              style,
              model,
              speed,
              pitch,
              emotion,
              variability,
            }),
          });

          const data = await res.json();
          if (res.status === 429 || data.retryAfter) {
            const rawWait = data.retryAfter || (attempt + 1) * 2;
            const waitSec = Math.min(rawWait, 4);
            for (let s = waitSec; s > 0; s--) {
              if (onWait) onWait(s);
              await new Promise((r) => setTimeout(r, 1000));
            }
            continue;
          }

          if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
          }

          const { samples, rate } = await decodeAudioClip(data.audio);
          const trimmed = trimSilence(samples, rate);
          const finalClip = resample(trimmed, rate, MASTER_RATE);
          audioCache.current.set(cacheKey, finalClip);
          return finalClip;
        } catch (e: any) {
          if (attempt === 3) throw e;
          await new Promise((r) => setTimeout(r, 600));
        }
      }
      throw new Error('Ses oluşturulamadı, lütfen tekrar deneyin.');
    },
    [model, speakers]
  );

  // Play clip
  const playClip = useCallback(
    (samples: Float32Array) => {
      if (mainAudioRef.current) mainAudioRef.current.pause();
      if (previewAudioRef.current) {
        previewAudioRef.current.src = URL.createObjectURL(wavBlob(samples, MASTER_RATE));
        previewAudioRef.current.play().catch(() => {});
      }
    },
    []
  );

  // Build Output Player
  const buildOutput = useCallback(
    (currentItems: QuestionItem[]) => {
      const segs: ItemPart[] = [];
      if (leadTime > 0) segs.push({ kind: 'si', s: silence(leadTime) });

      for (const it of currentItems) {
        segs.push(...getItemParts(it));
        if (afterTime > 0) segs.push({ kind: 'si', s: silence(afterTime) });
      }

      const merged = concat(segs.map((x) => x.s));
      setMergedSamples(merged);
      const dur = merged.length / MASTER_RATE;
      setTotalDuration(dur);
      setEstDuration(fmtTime(dur));

      setTapeSegments(
        segs.map((x) => ({
          kind: x.kind,
          length: x.s.length,
        }))
      );

      if (mainAudioRef.current) {
        mainAudioRef.current.src = URL.createObjectURL(wavBlob(merged, MASTER_RATE));
      }
    },
    [leadTime, afterTime, getItemParts]
  );

  // Process a single item with ultra-fast sequential segment synthesis (prevents RPM burst drops)
  const processItem = useCallback(
    async (it: QuestionItem, force = false): Promise<QuestionItem> => {
      const updated = { ...it, ready: false, st: 'busy' as const, status: 'Seslendiriliyor…' };
      setItems((prev) => prev.map((x) => (x.n === it.n ? updated : x)));

      const waitCb = (s: number) => {
        setItems((prev) =>
          prev.map((x) =>
            x.n === it.n
              ? {
                  ...x,
                  status: `Hız sınırı · ${s} sn`,
                }
              : x
          )
        );
        setProgressText(`Hız sınırlaması: ${s} sn bekleniyor`);
      };

      const numText = numTpl.trim() ? numTpl.replace(/\{n\}/g, String(it.n)) : '';

      // High-speed synthesis: sequential within question avoids burst rate limit
      let numClip: Float32Array | null = null;
      if (numText) {
        numClip = await fetchTts(numText, 1, force, waitCb, it.speed);
      }

      const segClips: (Float32Array | null)[] = [];
      for (const s of it.segs) {
        const clip = await fetchTts(s.text, s.spk, force, waitCb, it.speed);
        segClips.push(clip);
      }

      const processedSegs = it.segs.map((s, idx) => ({
        ...s,
        clip: segClips[idx],
      }));

      const readyItem: QuestionItem = {
        ...it,
        segs: processedSegs,
        numClip,
        ready: true,
        st: 'ready' as const,
        status: 'Hazır',
      };

      const totalLen = getItemSamples(readyItem).length;
      readyItem.status = `Hazır · ${(totalLen / MASTER_RATE).toFixed(1)} sn`;

      setItems((prev) => prev.map((x) => (x.n === it.n ? readyItem : x)));
      return readyItem;
    },
    [numTpl, fetchTts, getItemSamples]
  );

  // Redo a single question with optional new speed
  const redoQuestion = useCallback(
    async (n: number, newSpeed?: number) => {
      const target = items.find((x) => x.n === n);
      if (!target) return;
      const itemToProcess = newSpeed !== undefined ? { ...target, speed: newSpeed } : target;
      try {
        const finished = await processItem(itemToProcess, true);
        showToast(`${n}. soru ${newSpeed !== undefined ? `hızı (${newSpeed > 0 ? `+${newSpeed}%` : `${newSpeed}%`}) güncellenerek` : ''} yeniden seslendirildi.`);
        const nextItems = items.map((x) => (x.n === n ? finished : x));
        if (nextItems.every((x) => x.ready)) {
          buildOutput(nextItems);
        }
      } catch (e: any) {
        setItems((prev) =>
          prev.map((x) => (x.n === n ? { ...x, st: 'fail', status: e.message } : x))
        );
        showToast(e.message, true);
      }
    },
    [items, processItem, showToast, buildOutput]
  );

  // Generate All with controlled concurrency
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    const r = parseAll();
    if (!r.items.length) {
      showToast('Hiç soru bulunamadı. Her soruyu ayrı bir satıra yazın.', true);
      return;
    }

    const initItems: QuestionItem[] = r.items.map((segs, i) => ({
      n: i + 1,
      segs: segs.map((s) => ({ ...s, clip: null })),
      numClip: null,
      ready: false,
      status: 'Sırada',
      st: '',
    }));

    setItems(initItems);
    setMergedSamples(null);
    setIsGenerating(true);
    if (mainAudioRef.current) mainAudioRef.current.pause();

    const N = initItems.length;
    const finalItems: (QuestionItem | null)[] = new Array(N).fill(null);
    let completedCount = 0;
    let failed = 0;

    // Process sequentially with pacing to guarantee 100% stability on all cloud environments
    for (let i = 0; i < N; i++) {
      const it = initItems[i];
      setProgressText(`${it.n}. soru hazırlanıyor (${completedCount + 1}/${N})`);
      try {
        const doneItem = await processItem(it, false);
        finalItems[i] = doneItem;
      } catch (e: any) {
        failed++;
        setItems((prev) =>
          prev.map((x) => (x.n === it.n ? { ...x, st: 'fail', status: e.message } : x))
        );
        showToast(`${it.n}. soru hatası: ${e.message}`, true);
      } finally {
        completedCount++;
        setProgressPercent(completedCount / N);
      }
      if (i < N - 1) {
        await new Promise((r) => setTimeout(r, 120));
      }
    }

    setIsGenerating(false);
    setProgressPercent(1);

    const successfulItems = finalItems.filter((x): x is QuestionItem => x !== null && x.ready);
    if (successfulItems.length === N) {
      setProgressText('Tamamlandı. Dinleyip indirebilirsiniz.');
      buildOutput(successfulItems);
      showToast('Dinleme seti hızla ve başarıyla hazırlandı!');
    } else {
      setProgressText(`${failed} soru seslendirilemedi. Listeden tekrar deneyin.`);
    }
  }, [isGenerating, parseAll, showToast, processItem, buildOutput]);

  // Voice Preview
  const [testingSpk, setTestingSpk] = useState<number | null>(null);
  const handlePreviewVoice = useCallback(
    async (spkNum: number) => {
      setTestingSpk(spkNum);
      try {
        const cfg = speakers.find((s) => s.id === spkNum) || speakers[0];
        const sampleText =
          cfg.gender === 'F'
            ? 'Yes, I do. How much is it?'
            : 'Look at this coat. Do you like it? It is seventy dollars.';
        const clip = await fetchTts(sampleText, spkNum, false);
        playClip(clip);
        showToast(`${spkNum}. konuşmacı (${cfg.voice} · ${cfg.gender === 'F' ? 'Kadın' : 'Erkek'}) sesi dinletiliyor`);
      } catch (e: any) {
        showToast(e.message, true);
      } finally {
        setTestingSpk(null);
      }
    },
    [speakers, fetchTts, playClip, showToast]
  );

  // Test Server & Model connection
  const handleTestConnection = useCallback(async () => {
    setConnStatus('testing');
    setConnText('Test ediliyor…');
    try {
      const res = await fetch('/api/tts/status');
      const data = await res.json();
      if (data.ok) {
        setConnStatus('connected');
        setConnText('Bağlantı Başarılı');
        showToast(`Model hazır: ${model}`);
      } else {
        throw new Error('Bağlantı sağlanamadı');
      }
    } catch (e: any) {
      setConnStatus('error');
      setConnText('Bağlantı Hatası');
      showToast('Bağlantı test edilemedi: ' + e.message, true);
    }
  }, [model, showToast]);

  // Clean SSML Button
  const handleCleanText = useCallback(() => {
    const r = parseAll();
    if (!r.items.length) {
      showToast('Dönüştürülecek soru bulunamadı.', true);
      return;
    }
    if (r.timing) {
      setGapTime(r.timing.gap);
      setAfterTime(r.timing.after);
    }
    if (editorRef.current) {
      editorRef.current.innerHTML = r.items
        .map(
          (segs, i) =>
            '<div>' +
            (i + 1) +
            '. ' +
            segs
              .map((s) => {
                if (s.spk === 1) return esc(s.text);
                if (s.spk === 2) return '<b>' + esc(s.text) + '</b>';
                return `<span class="spk-${s.spk}" data-spk="${s.spk}">` + esc(s.text) + '</span>';
              })
              .join(' ') +
            '</div>'
        )
        .join('');
    }
    scheduleParseAndEstimate();
    showToast(
      r.timing
        ? `SSML temizlendi. Duraklamalar aktarıldı: ${r.timing.gap} sn / ${r.timing.after} sn.`
        : 'Metin düzenlendi.'
    );
  }, [parseAll, scheduleParseAndEstimate, showToast]);

  // Convert back to SSML code block (<speak>, <break time="..."/>, etc.)
  const handleConvertToCode = useCallback(() => {
    const r = parseAll();
    if (!r.items.length) {
      showToast('Koda dönüştürülecek soru bulunamadı.', true);
      return;
    }
    const gapSec = gapTime > 0 ? `${gapTime}s` : '1s';
    const afterSec = afterTime > 0 ? afterTime : 20;

    // Split afterSec into clean break tags (e.g. 20s -> two 10s breaks)
    let afterBreaks = '';
    if (afterSec > 0) {
      if (afterSec <= 10) {
        afterBreaks = `&lt;break time="${afterSec}s"/&gt;`;
      } else {
        const full10s = Math.floor(afterSec / 10);
        const remainder = afterSec % 10;
        afterBreaks = Array(full10s).fill('&lt;break time="10s"/&gt;').join('');
        if (remainder > 0) {
          afterBreaks += `&lt;break time="${remainder}s"/&gt;`;
        }
      }
    }

    const codeLines: string[] = [
      '&lt;speak&gt;',
      '  &lt;prosody rate="0.95"&gt;',
      ...r.items.map((segs, i) => {
        const questionBody = segs
          .map((s) => {
            if (s.spk === 1) return esc(s.text);
            if (s.spk === 2) return '<b>' + esc(s.text) + '</b>';
            return `&lt;s${s.spk}&gt;` + esc(s.text) + `&lt;/s${s.spk}&gt;`;
          })
          .join(' ');
        return `  ${i + 1}. &lt;break time="${gapSec}"/&gt; ${questionBody} ${afterBreaks}`;
      }),
      '  &lt;/prosody&gt;',
      '&lt;/speak&gt;',
    ];

    if (editorRef.current) {
      editorRef.current.innerHTML = codeLines.map((line) => `<div>${line}</div>`).join('');
    }
    scheduleParseAndEstimate();
    showToast('Metin SSML kod formatına dönüştürüldü.');
  }, [parseAll, gapTime, afterTime, scheduleParseAndEstimate, showToast]);

  // Assign Speaker 1-5 to selected text or insert marker
  const handleAssignSpeaker = useCallback(
    (spkId: number) => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        document.execCommand('insertHTML', false, ` [S${spkId}] `);
      } else {
        if (spkId === 2) {
          document.execCommand('bold');
        } else if (spkId === 1) {
          document.execCommand('removeFormat');
        } else {
          const selectedText = selection.toString();
          document.execCommand(
            'insertHTML',
            false,
            `<span class="spk-${spkId}" data-spk="${spkId}">${selectedText}</span>`
          );
        }
      }
      scheduleParseAndEstimate();
      showToast(`${spkId}. konuşmacı atandı`);
    },
    [scheduleParseAndEstimate, showToast]
  );

  // Clear marks
  const handleClearMarks = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.querySelectorAll('b,strong').forEach((b) => b.replaceWith(...b.childNodes));
    editorRef.current
      .querySelectorAll<HTMLElement>('[style]')
      .forEach((el) => (el.style.fontWeight = ''));
    scheduleParseAndEstimate();
    showToast('Tüm konuşmacı işaretleri kaldırıldı.');
  }, [scheduleParseAndEstimate, showToast]);

  // Insert Pause tag
  const handleInsertPause = useCallback(
    (durationStr: string = '1.0s') => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      document.execCommand('insertHTML', false, ` [pause ${durationStr}] `);
      scheduleParseAndEstimate();
      showToast(`[pause ${durationStr}] duraklaması eklendi.`);
    },
    [scheduleParseAndEstimate, showToast]
  );

  // Bold Shortcut
  const handleBoldClick = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('bold');
      scheduleParseAndEstimate();
    }
  }, [scheduleParseAndEstimate]);

  // Download Handlers
  const downloadBlob = (blob: Blob, name: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
  };

  const handleDownloadWav = () => {
    if (!mergedSamples) return;
    downloadBlob(wavBlob(mergedSamples, MASTER_RATE), 'dinleme-seti.wav');
    showToast('WAV dosyası indirildi.');
  };

  const [isMp3Encoding, setIsMp3Encoding] = useState(false);
  const handleDownloadMp3 = async () => {
    if (!mergedSamples) return;
    const lamejs = (window as any).lamejs;
    if (!lamejs) {
      showToast('MP3 kodlayıcı yüklenemedi; lütfen WAV olarak indirin.', true);
      return;
    }
    setIsMp3Encoding(true);
    try {
      const enc = new lamejs.Mp3Encoder(1, MASTER_RATE, 128);
      const chunks: Uint8Array[] = [];
      const block = 1152;
      const pcm = new Int16Array(mergedSamples.length);
      for (let i = 0; i < pcm.length; i++) {
        const v = Math.max(-1, Math.min(1, mergedSamples[i]));
        pcm[i] = v < 0 ? v * 32768 : v * 32767;
      }
      for (let i = 0; i < pcm.length; i += block) {
        const out = enc.encodeBuffer(pcm.subarray(i, i + block));
        if (out.length) chunks.push(new Uint8Array(out));
        if (i % (block * 400) === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      const end = enc.flush();
      if (end.length) chunks.push(new Uint8Array(end));
      downloadBlob(new Blob(chunks as any, { type: 'audio/mpeg' }), 'dinleme-seti.mp3');
      showToast('MP3 dosyası başarıyla indirildi.');
    } catch (e: any) {
      showToast('MP3 oluşturulamadı, WAV indirin.', true);
    } finally {
      setIsMp3Encoding(false);
    }
  };

  // Tape Scrubber click
  const handleTapeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainAudioRef.current || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    mainAudioRef.current.currentTime = ratio * totalDuration;
  };

  const toggleMainPlay = () => {
    if (!mainAudioRef.current) return;
    if (isPlaying) {
      mainAudioRef.current.pause();
    } else {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      mainAudioRef.current.play().catch(() => {});
    }
  };

  // Stepper adjustments
  const adjustNumber = (
    currentVal: number,
    delta: number,
    setter: React.Dispatch<React.SetStateAction<number>>,
    min = 0,
    decimals = 1
  ) => {
    const mult = Math.pow(10, decimals);
    const next = Math.max(min, Math.round((currentVal + delta) * mult) / mult);
    setter(next);
  };

  // Find voice metadata
  const getVoiceMeta = (vName: string) => {
    return VOICES.find((v) => v.name === vName) || VOICES[0];
  };

  // Render Capsule Control Card for each speaker (1-5)
  const renderSpeakerCapsule = (spkNum: number, cfg: SpeakerConfig) => {
    const vMeta = getVoiceMeta(cfg.voice);
    const accentMeta = ACCENTS.find((a) => a.id === cfg.accent) || ACCENTS[0];
    const isPlayingThis = testingSpk === spkNum;

    const badgeLabels: Record<number, string> = {
      1: 'Ana Anlatıcı · Normal Metin',
      2: '2. Ses · Kalın / Ctrl+B',
      3: '3. Ses · Yeşil [S3]',
      4: '4. Ses · Turuncu [S4]',
      5: '5. Ses · Pembe [S5]',
    };

    return (
      <div className={`studio-speaker-card spk-${spkNum} ${spkNum === 1 ? 'one' : spkNum === 2 ? 'two' : ''}`}>
        <div className="studio-speaker-header">
          <div className="studio-speaker-title">
            <span>{spkNum}. Konuşmacı</span>
            <span className={`studio-speaker-badge spk-${spkNum}`}>
              {badgeLabels[spkNum] || `${spkNum}. Ses`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: vMeta.gender === 'F' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: vMeta.gender === 'F' ? '#EC4899' : '#3B82F6',
              }}
            >
              {vMeta.gender === 'F' ? '♀ Kadın Sesi' : '♂ Erkek Sesi'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {vMeta.tone}
            </span>
          </div>
        </div>

        {/* Toolbar Pill Row (Matching Reference Image) */}
        <div className="studio-toolbar-row">
          {/* Avatar + Voice Name + Gender (Separated into Kadın & Erkek optgroups) */}
          <div className="pill-voice-profile">
            <img src={vMeta.avatar} alt={vMeta.name} className="voice-avatar" />
            <div className="voice-select-box">
              <select
                className="voice-select-clean"
                value={cfg.voice}
                onChange={(e) => {
                  const nextVoice = e.target.value;
                  const meta = getVoiceMeta(nextVoice);
                  updateSpeaker(spkNum, { voice: nextVoice, gender: meta.gender as 'M' | 'F' });
                }}
                title="Ses Karakteri (Kadın & Erkek seçenekleri)"
              >
                <optgroup label="👩 Kadın Sesleri (Female)">
                  {VOICES.filter((v) => v.gender === 'F').map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} (Kadın) · {v.tone}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="👨 Erkek Sesleri (Male)">
                  {VOICES.filter((v) => v.gender === 'M').map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} (Erkek) · {v.tone}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            {/* Flag / Accent */}
            <select
              className="voice-flag-clean"
              value={cfg.accent}
              onChange={(e) => updateSpeaker(spkNum, { accent: e.target.value })}
              title="Aksan / Bayrak"
            >
              {ACCENTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.flag} {a.id}
                </option>
              ))}
            </select>
          </div>

          {/* Emotion / Tone Capsule */}
          <div className="relative">
            <select
              className="pill-capsule tone"
              value={cfg.emotion}
              onChange={(e) => updateSpeaker(spkNum, { emotion: e.target.value })}
              title="Konuşma Tonu"
            >
              {EMOTION_PRESETS.map((em) => (
                <option key={em.id} value={em.id}>
                  {em.emoji} {em.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pitch Pill with Click-to-Slider Popover */}
          <div className="relative">
            <button
              type="button"
              className={`pill-capsule ${cfg.pitch !== 0 ? 'active' : ''}`}
              onClick={() =>
                setActivePopover(
                  activePopover?.spk === spkNum && activePopover?.type === 'pitch'
                    ? null
                    : { spk: spkNum, type: 'pitch' }
                )
              }
              title="Perde (Pitch) ayarla"
            >
              Pitch <b>{cfg.pitch > 0 ? `+${cfg.pitch}%` : `${cfg.pitch}%`}</b>
            </button>
            {activePopover?.spk === spkNum && activePopover?.type === 'pitch' && (
              <div className="slider-popover">
                <div className="slider-popover-head">
                  <span>Ses Perdesi (Pitch)</span>
                  <button
                    type="button"
                    style={{ fontSize: '0.72rem', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={() => updateSpeaker(spkNum, { pitch: 0 })}
                  >
                    Sıfırla
                  </button>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={5}
                  value={cfg.pitch}
                  onChange={(e) => updateSpeaker(spkNum, { pitch: parseInt(e.target.value, 10) })}
                  className="slider-range-input"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>
                  <span>Derin (-50%)</span>
                  <span>Normal (0%)</span>
                  <span>Tiz (+50%)</span>
                </div>
              </div>
            )}
          </div>

          {/* Speed Pill with Click-to-Slider Popover */}
          <div className="relative">
            <button
              type="button"
              className={`pill-capsule speed ${cfg.speed !== 0 ? 'active' : ''}`}
              onClick={() =>
                setActivePopover(
                  activePopover?.spk === spkNum && activePopover?.type === 'speed'
                    ? null
                    : { spk: spkNum, type: 'speed' }
                )
              }
              title="Okuma Hızı (Speed) ayarla"
            >
              Speed <b>{cfg.speed > 0 ? `+${cfg.speed}%` : `${cfg.speed}%`}</b>
            </button>
            {activePopover?.spk === spkNum && activePopover?.type === 'speed' && (
              <div className="slider-popover">
                <div className="slider-popover-head">
                  <span>Okuma Hızı (Speed)</span>
                  <button
                    type="button"
                    style={{ fontSize: '0.72rem', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={() => updateSpeaker(spkNum, { speed: 0 })}
                  >
                    Sıfırla
                  </button>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  step={5}
                  value={cfg.speed}
                  onChange={(e) => updateSpeaker(spkNum, { speed: parseInt(e.target.value, 10) })}
                  className="slider-range-input"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>
                  <span>Yavaş (-50%)</span>
                  <span>Standart (0%)</span>
                  <span>Hızlı (+50%)</span>
                </div>
              </div>
            )}
          </div>

          {/* Variability Pill */}
          <div className="relative">
            <button
              type="button"
              className={`pill-capsule action ${cfg.variability !== 50 ? 'active' : ''}`}
              onClick={() =>
                setActivePopover(
                  activePopover?.spk === spkNum && activePopover?.type === 'variability'
                    ? null
                    : { spk: spkNum, type: 'variability' }
                )
              }
              title="Vurgu Çeşitliliği (Variability)"
            >
              <span>✦</span> Variability <b>{cfg.variability}%</b>
            </button>
            {activePopover?.spk === spkNum && activePopover?.type === 'variability' && (
              <div className="slider-popover">
                <div className="slider-popover-head">
                  <span>Vurgu & Ton Değişkenliği</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={cfg.variability}
                  onChange={(e) => updateSpeaker(spkNum, { variability: parseInt(e.target.value, 10) })}
                  className="slider-range-input"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>
                  <span>Monoton</span>
                  <span>Dengeli</span>
                  <span>Çok Dinamik</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Pause Injector */}
          <button
            type="button"
            className="pill-capsule action"
            onClick={() => handleInsertPause(spkNum === 1 ? '1.0s' : '0.5s')}
            title="İmlecin olduğu yere duraklama etiketi ekle"
          >
            Add Pause
          </button>

          {/* Quick Assign / Emphasis button */}
          <button
            type="button"
            className="pill-capsule action"
            onClick={() => handleAssignSpeaker(spkNum)}
            title={`Seçili metni ${spkNum}. konuşmacıya ata`}
          >
            ❝ Bu Sese Ata
          </button>

          {/* Test / Play Voice Button */}
          <button
            type="button"
            className="pill-play-btn"
            disabled={isPlayingThis}
            onClick={() => handlePreviewVoice(spkNum)}
            title={`${spkNum}. konuşmacı (${cfg.voice}) sesini dinle`}
          >
            {isPlayingThis ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 4.5v15l13-7.5z" />
              </svg>
            )}
          </button>
        </div>

        {/* Detailed style instruction text */}
        <div style={{ marginTop: 10 }}>
          <input
            className="input"
            type="text"
            style={{ fontSize: '0.82rem', padding: '6px 10px', background: 'var(--sunken)' }}
            value={cfg.instruction}
            onChange={(e) => updateSpeaker(spkNum, { instruction: e.target.value })}
            placeholder="Görünmez seslendirme talimatı (örn. Read slowly and clearly - asla okunmaz, sadece tonu yönetir)"
            title="Seslendirme üslubu ve tonlama talimatı (asla okunmaz)"
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Top Header */}
      <header className="top">
        <div className="top-in">
          <div className="brand">
            <svg width="48" height="48" viewBox="0 0 52 52" aria-hidden="true">
              <rect
                x="2"
                y="10"
                width="48"
                height="32"
                rx="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <circle cx="17" cy="24" r="6" fill="none" stroke="#79A6F5" strokeWidth="2.5" />
              <circle cx="35" cy="24" r="6" fill="none" stroke="#BC9BF5" strokeWidth="2.5" />
              <path d="M17 30h18" stroke="currentColor" strokeWidth="2" />
              <path d="M12 42l4-6h20l4 6" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div>
              <h1>Dinleme seti üretici</h1>
              <p>Stüdyo sınıfı konuşmacı kontrolleri, hız/perde yönetimi ve tam süreli sınav setleri · Gemini TTS</p>
            </div>
          </div>
          <button
            className={`conn ${connStatus === 'connected' ? 'on' : connStatus === 'error' ? 'err' : ''}`}
            id="connPill"
            type="button"
            onClick={handleTestConnection}
            title="Bağlantıyı yeniden kontrol et"
          >
            <span className="led"></span>
            <span>{connText}</span>
          </button>
        </div>
      </header>

      {/* Main Shell */}
      <div className="shell">
        {/* Sidebar Controls */}
        <aside className="side" aria-label="Ayarlar">
          {/* Connection & Model Panel */}
          <details className="panel" open>
            <summary>
              Model ve Motor{' '}
              <span className="sum-meta">
                {connStatus === 'connected' ? '· bağlı' : ''}
              </span>
            </summary>
            <div className="panel-body">
              <div className="field">
                <label htmlFor="model">Gemini TTS Modeli</label>
                <div className="with-btn">
                  <select
                    className="input"
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m === 'gemini-3.8-flash-lite-tts'
                          ? 'Gemini 3.8 Flash Lite TTS (En Hızlı & Yüksek Kota - Önerilen)'
                          : m === 'gemini-3.8-flash-tts'
                          ? 'Gemini 3.8 Flash TTS (Stüdyo Kalitesi)'
                          : m === 'gemini-2.5-flash-preview-tts'
                          ? 'Gemini 2.5 Flash TTS (Alternatif Hızlı)'
                          : m}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn"
                    type="button"
                    onClick={handleTestConnection}
                    title="Model bağlantısını test et"
                  >
                    Test
                  </button>
                </div>
                <p className="hint">
                  Doğal prosodi ve hız/perde modifikasyonları doğrudan sunucu tarafında işlenir.
                </p>
              </div>
            </div>
          </details>

          {/* Timing Panel */}
          <details className="panel" open>
            <summary>Zamanlama & Duraklamalar</summary>
            <div className="panel-body">
              <div className="trow">
                <label htmlFor="lead">Başta sessizlik</label>
                <div className="num">
                  <button
                    type="button"
                    onClick={() => adjustNumber(leadTime, -0.5, setLeadTime)}
                    aria-label="azalt"
                  >
                    −
                  </button>
                  <input
                    id="lead"
                    type="number"
                    min={0}
                    step={0.5}
                    value={leadTime}
                    onChange={(e) => setLeadTime(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber(leadTime, 0.5, setLeadTime)}
                    aria-label="artır"
                  >
                    +
                  </button>
                  <span>sn</span>
                </div>
              </div>

              <div className="trow">
                <label htmlFor="gap">Numaradan sonra</label>
                <div className="num">
                  <button
                    type="button"
                    onClick={() => adjustNumber(gapTime, -0.5, setGapTime)}
                    aria-label="azalt"
                  >
                    −
                  </button>
                  <input
                    id="gap"
                    type="number"
                    min={0}
                    step={0.5}
                    value={gapTime}
                    onChange={(e) => setGapTime(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber(gapTime, 0.5, setGapTime)}
                    aria-label="artır"
                  >
                    +
                  </button>
                  <span>sn</span>
                </div>
              </div>

              <div className="trow">
                <label htmlFor="turn">Konuşmacı değişince</label>
                <div className="num">
                  <button
                    type="button"
                    onClick={() => adjustNumber(turnTime, -0.1, setTurnTime)}
                    aria-label="azalt"
                  >
                    −
                  </button>
                  <input
                    id="turn"
                    type="number"
                    min={0}
                    step={0.1}
                    value={turnTime}
                    onChange={(e) => setTurnTime(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber(turnTime, 0.1, setTurnTime)}
                    aria-label="artır"
                  >
                    +
                  </button>
                  <span>sn</span>
                </div>
              </div>

              <div className="trow">
                <label htmlFor="after">Sorudan sonra boşluk</label>
                <div className="num">
                  <button
                    type="button"
                    onClick={() => adjustNumber(afterTime, -1, setAfterTime, 0, 0)}
                    aria-label="azalt"
                  >
                    −
                  </button>
                  <input
                    id="after"
                    type="number"
                    min={0}
                    step={1}
                    value={afterTime}
                    onChange={(e) => setAfterTime(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                  <button
                    type="button"
                    onClick={() => adjustNumber(afterTime, 1, setAfterTime, 0, 0)}
                    aria-label="artır"
                  >
                    +
                  </button>
                  <span>sn</span>
                </div>
              </div>

              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="numTpl">Soru numarası şablonu</label>
                <input
                  className="input"
                  id="numTpl"
                  type="text"
                  value={numTpl}
                  onChange={(e) => setNumTpl(e.target.value)}
                />
                <p className="hint">&#123;n&#125; yerine numara gelir. Boş bırakırsanız numara okunmaz.</p>
              </div>
            </div>
          </details>
        </aside>

        {/* Main Work Area */}
        <main className="work">
          {/* Studio Voice Deck (Top Section as requested in screenshot) */}
          <section className="card" style={{ padding: 18 }}>
            <div className="card-head" style={{ marginBottom: 12 }}>
              <div>
                <h2>Konuşmacı ve Ses Stüdyosu</h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                  5 farklı kadın & erkek ses seçeneği, bağımsız hız/perde/ton ve vurgu yönetimi
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn ghost"
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                  onClick={() => setShowAllSpeakers((prev) => !prev)}
                >
                  {showAllSpeakers ? '⊟ Sekmeli Görünüm' : '⊞ Tüm 5 Konuşmacıyı Göster'}
                </button>
                <span className="chip">5 Konuşmacı Aktif</span>
              </div>
            </div>

            {/* 5 Speaker Switcher Tabs */}
            <div className="speaker-tabs-bar">
              {speakers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`speaker-tab-btn spk-${s.id} ${activeSpeakerTab === s.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSpeakerTab(s.id);
                    if (!showAllSpeakers) {
                      // switched active tab in single-card view
                    }
                  }}
                  title={`${s.name}: ${s.voice} (${s.gender === 'F' ? 'Kadın' : 'Erkek'})`}
                >
                  <span>{s.gender === 'F' ? '♀' : '♂'}</span>
                  <span>{s.id}. {s.voice}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({s.gender === 'F' ? 'Kadın' : 'Erkek'})</span>
                </button>
              ))}
            </div>

            {/* Render 5 Speaker Capsules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {showAllSpeakers
                ? speakers.map((s) => <React.Fragment key={s.id}>{renderSpeakerCapsule(s.id, s)}</React.Fragment>)
                : renderSpeakerCapsule(activeSpeakerTab, speakers[activeSpeakerTab - 1] || speakers[0])}
            </div>
          </section>

          {/* Questions Editor Card */}
          <section className="card">
            <div className="card-head">
              <h2>Sorular ve Metin Bloğu</h2>
              <span className="chip" id="qCount">
                {qCountText}
              </span>
            </div>
            <div className="toolbar" role="toolbar" aria-label="Metin biçimi">
              {/* Speaker Marking Buttons 1 through 5 */}
              <button
                className="btn mark-spk spk-1"
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAssignSpeaker(1)}
                title="Seçili metni 1. Konuşmacıya ata"
              >
                1. Konuşmacı
              </button>
              <button
                className="btn mark-spk spk-2"
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAssignSpeaker(2)}
                title="Seçili metni 2. Konuşmacıya ata (Ctrl+B)"
              >
                <b>B</b> 2. Konuşmacı <kbd>Ctrl B</kbd>
              </button>
              <button
                className="btn mark-spk spk-3"
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAssignSpeaker(3)}
                title="Seçili metni 3. Konuşmacıya ata"
              >
                3. Konuşmacı
              </button>
              <button
                className="btn mark-spk spk-4"
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAssignSpeaker(4)}
                title="Seçili metni 4. Konuşmacıya ata"
              >
                4. Konuşmacı
              </button>
              <button
                className="btn mark-spk spk-5"
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleAssignSpeaker(5)}
                title="Seçili metni 5. Konuşmacıya ata"
              >
                5. Konuşmacı
              </button>
              <span className="sep"></span>
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleInsertPause('1.0s')}
                title="1 saniyelik duraklama ekle"
              >
                + [pause 1.0s]
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => handleInsertPause('5.0s')}
                title="5 saniyelik duraklama ekle"
              >
                + [pause 5.0s]
              </button>
              <button className="btn ghost" type="button" onClick={handleClearMarks}>
                İşaretleri kaldır
              </button>
              <span className="sep"></span>
              <button
                className="btn ghost"
                type="button"
                onClick={handleCleanText}
                title="SSML etiketlerini sil, duraklamaları ayarlara aktar"
              >
                Düz metne çevir
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={handleConvertToCode}
                title="Soruları ayarlanmış duraklamalarla birlikte SSML kod formatına geri dönüştür"
                style={{ fontWeight: 600 }}
              >
                &lt;/&gt; Koda dönüştür
              </button>
            </div>
            <div
              className="editor"
              id="editor"
              ref={editorRef}
              contentEditable
              spellCheck={false}
              role="textbox"
              aria-multiline={true}
              aria-label="Sorular"
              onInput={scheduleParseAndEstimate}
            />
            <div className="foot">
              <p className="hint" style={{ margin: 0 }}>
                Her satıra bir soru. Seçip <b>B</b>'ye basınca o bölümü 2. konuşmacı okur.
                İsterseniz doğrudan <code>[pause 2.0s]</code> veya SSML etiketleri kullanabilirsiniz.
              </p>
            </div>
          </section>

          {/* Recording & Timeline Card */}
          <section className="card">
            <div className="card-head">
              <h2>Üretilen Kayıtlar</h2>
              <span className="chip" id="rCount">
                {items.length
                  ? `${items.filter((i) => i.ready).length}/${items.length} hazır`
                  : 'Henüz seslendirilmedi'}
              </span>
            </div>

            {items.length === 0 && (
              <div className="empty">
                <b>Seslendirme bekleniyor</b>
                Yukarıdaki konuşmacı hız ve perde ayarlarını belirledikten sonra alttaki "Seslendir" düğmesine basın.
              </div>
            )}

            {items.length > 0 && (
              <ol className="items">
                {items.map((it) => (
                  <li key={it.n} className={it.st}>
                    <span className="qn">{it.n}</span>
                    <div>
                      <div className="qt">
                        {it.segs.map((s, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && ' '}
                            <span className={`s${s.spk || 1}`}>{s.text}</span>
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="qs">{it.status}</div>
                    </div>
                    {/* Per-item Speed Capsule (Matching user reference pill design) */}
                    <div className="relative" style={{ justifySelf: 'end' }}>
                      <button
                        type="button"
                        className={`item-speed-capsule ${it.speed !== undefined && it.speed !== spk1.speed ? 'active' : ''}`}
                        onClick={() =>
                          setActiveItemSpeedPopover(activeItemSpeedPopover === it.n ? null : it.n)
                        }
                        title="Bu sorunun hızını ayarla"
                      >
                        Speed <b>{it.speed !== undefined ? (it.speed > 0 ? `+${it.speed}%` : `${it.speed}%`) : (spk1.speed > 0 ? `+${spk1.speed}%` : `${spk1.speed}%`)}</b>
                      </button>

                      {activeItemSpeedPopover === it.n && (
                        <div className="item-speed-popover">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: '0.8rem', fontWeight: 700 }}>
                            <span>{it.n}. Soru Hızı</span>
                            <button
                              type="button"
                              style={{ fontSize: '0.72rem', color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                              onClick={() => {
                                redoQuestion(it.n, spk1.speed);
                                setActiveItemSpeedPopover(null);
                              }}
                            >
                              Varsayılan ({spk1.speed > 0 ? `+${spk1.speed}%` : `${spk1.speed}%`})
                            </button>
                          </div>
                          <input
                            type="range"
                            min={-50}
                            max={50}
                            step={5}
                            value={it.speed !== undefined ? it.speed : spk1.speed}
                            onChange={(e) => {
                              const newSpeed = parseInt(e.target.value, 10);
                              setItems((prev) =>
                                prev.map((x) => (x.n === it.n ? { ...x, speed: newSpeed } : x))
                              );
                            }}
                            className="slider-range-input"
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4, marginBottom: 10 }}>
                            <span>Yavaş (-50%)</span>
                            <span>Normal (0%)</span>
                            <span>Hızlı (+50%)</span>
                          </div>
                          <button
                            type="button"
                            className="btn primary"
                            style={{ width: '100%', padding: '6px 12px', fontSize: '0.82rem', borderRadius: 'var(--r-sm)' }}
                            onClick={() => {
                              const currentItemSpeed = it.speed !== undefined ? it.speed : spk1.speed;
                              redoQuestion(it.n, currentItemSpeed);
                              setActiveItemSpeedPopover(null);
                            }}
                          >
                            Hızı Uygula & Yenile
                          </button>
                        </div>
                      )}
                    </div>

                    <canvas
                      className="wave"
                      aria-hidden="true"
                      ref={(el) => {
                        if (el) canvasRefs.current.set(it.n, el);
                        else canvasRefs.current.delete(it.n);
                      }}
                    />
                    <div className="qb">
                      <button
                        className="btn icon"
                        type="button"
                        disabled={!it.ready}
                        onClick={() => playClip(getItemSamples(it))}
                        aria-label={`${it.n}. soruyu dinle`}
                        title="Soruyu dinle"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 4.5v15l13-7.5z" />
                        </svg>
                      </button>
                      <button
                        className="btn icon"
                        type="button"
                        onClick={() => redoQuestion(it.n)}
                        aria-label={`${it.n}. soruyu yeniden seslendir`}
                        title="Yeniden seslendir"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        >
                          <path d="M20 12a8 8 0 1 1-2.3-5.6" />
                          <path d="M20 4v5h-5" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {/* Master Audio Output Player */}
            {mergedSamples && (
              <div className="out">
                <div className="player">
                  <button
                    className="play"
                    type="button"
                    onClick={toggleMainPlay}
                    aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
                  >
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 4.5v15l13-7.5z" />
                      </svg>
                    )}
                  </button>
                  <div className="tapewrap">
                    <div
                      className="tape"
                      onClick={handleTapeClick}
                      title="Atlamak için tıklayın"
                    >
                      {tapeSegments.map((seg, idx) => (
                        <div
                          key={idx}
                          className={`seg ${seg.kind}`}
                          style={{ flex: `${seg.length} 0 0` }}
                        />
                      ))}
                      <div
                        className="head"
                        style={{
                          left: `${totalDuration ? (currentTime / totalDuration) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="ruler">
                      {Array.from(
                        { length: Math.floor(totalDuration / (totalDuration > 360 ? 60 : 30)) + 1 },
                        (_, idx) => {
                          const s = idx * (totalDuration > 360 ? 60 : 30);
                          if (s > totalDuration) return null;
                          return (
                            <span
                              key={s}
                              style={{
                                left: `${(s / totalDuration) * 100}%`,
                                transform: s === 0 ? 'none' : 'translateX(-50%)',
                              }}
                            >
                              {fmtTime(s)}
                            </span>
                          );
                        }
                      )}
                    </div>
                  </div>
                  <div className="ptime">
                    <b>{fmtTime(currentTime)}</b> / <span>{fmtTime(totalDuration)}</span>
                  </div>
                </div>
                <div className="legend">
                  {speakers.map((s) => (
                    <span key={s.id}>
                      <i style={{ background: `var(--spk${s.id})` }}></i>
                      {s.id}. {s.voice} ({s.gender === 'F' ? '♀ Kadın' : '♂ Erkek'})
                    </span>
                  ))}
                  <span>
                    <i style={{ background: 'var(--quiet)' }}></i>Sessizlik
                  </span>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Floating Bottom Dock */}
      <div className="dock">
        <div className="dock-in">
          <div className="est">
            <small>{mergedSamples ? 'Toplam süre' : 'Tahmini süre'}</small>
            <b>{estDuration}</b>
          </div>
          <div className="prog">
            <div className="bar">
              <i style={{ width: `${progressPercent * 100}%` }}></i>
            </div>
            <div className="ptext">{progressText}</div>
          </div>
          {mergedSamples && (
            <div className="dl">
              <button
                className="btn"
                type="button"
                disabled={isMp3Encoding}
                onClick={handleDownloadMp3}
                title="MP3 formatında indir"
              >
                {isMp3Encoding ? 'Hazırlanıyor…' : 'MP3'}
              </button>
              <button
                className="btn"
                type="button"
                onClick={handleDownloadWav}
                title="Kayıpsız WAV formatında indir"
              >
                WAV
              </button>
            </div>
          )}
          <button
            className="btn primary"
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? 'Seslendiriliyor…' : 'Seslendir'}
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      <div id="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.isError ? 'err' : ''}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
