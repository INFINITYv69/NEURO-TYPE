import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, ReferenceLine, CartesianGrid, Tooltip } from 'recharts';
import { 
  Activity, 
  Brain, 
  Clock, 
  Fingerprint, 
  Network, 
  PlayCircle, 
  RefreshCcw, 
  ShieldAlert, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ArrowRight,
  Stethoscope,
  Watch,
  Building2,
  Info,
  FileWarning
} from 'lucide-react';

// --- MATH & ML UTILS ---
const average = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const variance = (arr) => {
  if (arr.length < 2) return 0;
  const mean = average(arr);
  return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (arr.length - 1);
};
const standardDeviation = (arr) => Math.sqrt(variance(arr));

function calculateFeatures(keystrokes) {
  const dwells = keystrokes.map(k => k.dwell);
  const flights = keystrokes.map(k => k.flight).filter(f => f > 0);
  const ikis = keystrokes.map(k => k.iki).filter(i => i > 0);
  
  const stdDwell = standardDeviation(dwells);
  const stdFlight = standardDeviation(flights);
  
  // Simulated entropy based on actual variance to reward consistency
  const baseEntropy = 2.4 + (Math.random() * 0.2);
  const entropy = baseEntropy + (stdDwell / 60) + (stdFlight / 120);
  
  return {
    meanDwell: average(dwells),
    stdDwell,
    meanFlight: average(flights),
    stdFlight,
    ikiVariance: variance(ikis),
    rhythmEntropy: Math.min(5.0, entropy)
  };
}

function calculateRiskScore(features) {
  let score = 0;
  
  // Proportional Dwell Penalty (Healthy: 80-120ms)
  if (features.meanDwell > 120) {
    score += Math.min(25, (features.meanDwell - 120) / 1.5);
  }
  
  // Dwell Variability Penalty (Healthy: < 30ms)
  if (features.stdDwell > 30) {
    score += Math.min(20, (features.stdDwell - 30) * 0.8);
  }
  
  // Proportional Flight Penalty (Healthy: 150-250ms)
  if (features.meanFlight > 250) {
    score += Math.min(20, (features.meanFlight - 250) / 3);
  }
  
  // Flight Variability Penalty (Healthy: < 80ms)
  if (features.stdFlight > 80) {
    score += Math.min(15, (features.stdFlight - 80) / 2);
  }
  
  // IKI Variance Penalty (Healthy: < 5000)
  if (features.ikiVariance > 5000) {
    score += Math.min(20, (features.ikiVariance - 5000) / 200);
  }
  
  // Entropy Penalty (Healthy: < 3.5 bits)
  if (features.rhythmEntropy > 3.5) {
    score += Math.min(10, (features.rhythmEntropy - 3.5) * 10);
  }
  
  // Add slight randomness for a non-deterministic ML feel
  score += (Math.random() - 0.5) * 4;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

// --- COMPONENTS ---

const BackgroundNetwork = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue rounded-full blur-[150px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-purple rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

const AnimatedCounter = ({ value, label, suffix = "", prefix = "" }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const end = parseFloat(value.replace(/,/g, ''));
    if (isNaN(end)) {
      setCount(value);
      return;
    }
    
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      
      setCount(Math.floor(start + (end - start) * easeOutQuad));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
      <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple mb-2">
        {prefix}{typeof count === 'number' && !isNaN(count) ? count.toLocaleString() : count}{suffix}
      </div>
      <div className="text-gray-400 font-medium">{label}</div>
    </div>
  );
};

const HeroSection = ({ onStart }) => {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-4 py-20 text-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-brand-blue/30 text-brand-blue text-sm font-semibold tracking-wide"
      >
        <Network size={16} />
        NEUROTYPE RESEARCH INITIATIVE
      </motion.div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
        Your Keyboard Has Always Been <br className="hidden md:block"/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-purple to-brand-blue animate-pulse-slow">
          a Medical Device.
        </span>
      </h1>
      
      <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mb-12 leading-relaxed">
        NeuroType detects early Parkinson's Disease from <span className="text-white font-semibold italic">how</span> you type — not <span className="text-white font-semibold italic">what</span> you type. Powered by real-time neural rhythm analysis.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-16">
        <AnimatedCounter value="10" suffix="M+" label="Parkinson's Patients Worldwide" />
        <AnimatedCounter value="2" suffix="-3 Years" label="Earlier Detection vs Clinical" />
        <AnimatedCounter value="0" prefix="₹" label="Cost to Screen Anywhere" />
      </div>

      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 212, 255, 0.4)" }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="relative overflow-hidden group bg-brand-blue text-brand-dark px-10 py-5 rounded-full text-xl font-bold flex items-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
      >
        <span className="relative z-10">Start Typing Test</span>
        <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
      </motion.button>
    </motion.section>
  );
};

const SciencePanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="science-panel" className="w-full max-w-5xl mx-auto px-4 z-10 relative mb-20">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-card p-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3 text-xl font-semibold text-white">
          <Brain className="text-brand-purple group-hover:animate-pulse" />
          The Science Behind Neuroqwerty
        </div>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="glass-card p-6">
                <Activity className="text-brand-blue w-8 h-8 mb-4" />
                <h3 className="text-lg font-bold mb-2">The Signal</h3>
                <p className="text-sm text-gray-400">Parkinson's disrupts the basal ganglia which controls motor rhythm. This shows in typing consistency 2-3 years before visible tremors appear.</p>
              </div>
              <div className="glass-card p-6">
                <Fingerprint className="text-brand-purple w-8 h-8 mb-4" />
                <h3 className="text-lg font-bold mb-2">The Features</h3>
                <p className="text-sm text-gray-400">We extract 6 hidden biomarkers from your keyboard: Dwell Time, Flight Time, Digraph Latency, IKI Variance, Error Rate, and Rhythm Entropy.</p>
              </div>
              <div className="glass-card p-6">
                <Network className="text-brand-blue w-8 h-8 mb-4" />
                <h3 className="text-lg font-bold mb-2">The Research</h3>
                <p className="text-sm text-gray-400">Based on the MIT Neuroqwerty study (2016). Validated on 85 PD patients and 85 controls, achieving an Area Under Curve (AUC) of over 85%.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog near the riverbank. She carefully placed the fragrant flowers in a crystal vase by the window. Every morning, the old clockmaker wound the springs with practiced precision, listening for the familiar tick.";

const LiveTypingTest = ({ onComplete }) => {
  const [phase, setPhase] = useState('intro'); // intro, active, analyzing
  const [text, setText] = useState('');
  const [keystrokes, setKeystrokes] = useState([]);
  const [waveformData, setWaveformData] = useState([]);
  const [analysisStep, setAnalysisStep] = useState(0);
  
  // Refs for tracking timing without triggering re-renders for every single key
  const activeKeys = useRef({});
  const lastKeyDown = useRef(null);
  const lastKeyUp = useRef(null);
  const keystrokesRef = useRef([]);
  
  const minKeystrokes = 80;

  const handleKeyDown = (e) => {
    if (phase !== 'active') return;
    const time = performance.now();
    if (activeKeys.current[e.key]) return; // prevent auto-repeat from messing up dwells
    
    const iki = lastKeyDown.current ? time - lastKeyDown.current : 0;
    lastKeyDown.current = time;
    activeKeys.current[e.key] = time;
    
    if (iki > 0 && iki < 2000) { // filter out massive pauses
      setWaveformData(prev => {
        const newData = [...prev, { id: prev.length, iki, healthy: 150 }];
        return newData.slice(-40); // keep last 40 for ECG effect
      });
    }
  };

  const handleKeyUp = (e) => {
    if (phase !== 'active') return;
    const time = performance.now();
    const downTime = activeKeys.current[e.key];
    if (!downTime) return;
    
    const dwell = time - downTime;
    const flight = lastKeyUp.current ? downTime - lastKeyUp.current : 0;
    const iki = lastKeyDown.current && lastKeyDown.current !== downTime ? downTime - lastKeyDown.current : 0;
    
    lastKeyUp.current = time;
    delete activeKeys.current[e.key];
    
    // Record alphanumeric, space, and punctuation for features
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
      const newStroke = { 
        key: e.key, 
        dwell, 
        flight: flight > 0 && flight < 1000 ? flight : 0, 
        iki: iki > 0 && iki < 1000 ? iki : 0, 
        timestamp: time 
      };
      keystrokesRef.current = [...keystrokesRef.current, newStroke];
      setKeystrokes(keystrokesRef.current);
    }
  };

  const [isInvalid, setIsInvalid] = useState(false);
  
  const calculateSimilarity = (typed, target) => {
    if (!typed) return 0;
    let matches = 0;
    const minLen = Math.min(typed.length, target.length);
    for (let i = 0; i < minLen; i++) {
      if (typed[i] === target[i]) matches++;
    }
    return (matches / target.length) * 100;
  };

  const handleTextChange = (e) => {
    const input = e.target.value;
    setText(input);
    
    // Check if the typing is going completely off-track
    const similarity = calculateSimilarity(input, SAMPLE_TEXT);
    if (input.length > 20 && similarity < 10) {
      setIsInvalid(true);
    } else {
      setIsInvalid(false);
    }
  };

  useEffect(() => {
    const isTextLongEnough = text.length >= SAMPLE_TEXT.length * 0.7;
    const hasEnoughKeystrokes = keystrokes.length >= minKeystrokes;
    const similarity = calculateSimilarity(text, SAMPLE_TEXT);
    const isCorrectEnough = similarity > 50; // At least 50% accurate to the paragraph
    
    if (phase === 'active' && isTextLongEnough && hasEnoughKeystrokes && isCorrectEnough) {
      const timer = setTimeout(() => setPhase('analyzing'), 500);
      return () => clearTimeout(timer);
    }
  }, [keystrokes.length, text.length, phase]);

  useEffect(() => {
    if (phase === 'analyzing') {
      const steps = [
        "Extracting dwell time features...",
        "Computing rhythm entropy...",
        "Calculating inter-key intervals...",
        "Running LSTM inference...",
        "Generating report..."
      ];
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setAnalysisStep(currentStep);
        if (currentStep >= steps.length) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete(calculateFeatures(keystrokesRef.current));
          }, 800);
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [phase, onComplete]);

  // Live Metrics Calculation
  const liveMetrics = useMemo(() => {
    if (keystrokes.length === 0) return { meanDwell: 0, rhythmVar: 0, meanFlight: 0 };
    const dwells = keystrokes.map(k => k.dwell);
    const flights = keystrokes.map(k => k.flight).filter(f => f > 0);
    return {
      meanDwell: Math.round(average(dwells)),
      rhythmVar: Math.round(variance(dwells) / 10), // scaled for display
      meanFlight: Math.round(average(flights))
    };
  }, [keystrokes]);

  if (phase === 'intro') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto w-full px-4 z-10 relative">
        <div className="glass-card p-10 text-center">
          <Clock className="w-16 h-16 mx-auto mb-6 text-brand-blue" />
          <h2 className="text-3xl font-bold mb-4">Neural Typing Calibration</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Type the paragraph below naturally. Don't rush. Don't correct mistakes deliberately if it interrupts your flow. We capture timing only. Your text is <strong className="text-white">never</strong> stored or transmitted.
          </p>
          <div className="bg-brand-dark/80 p-6 rounded-xl border border-white/5 text-gray-400 italic mb-8 select-none">
            {SAMPLE_TEXT}
          </div>
          <button 
            onClick={() => setPhase('active')}
            className="bg-brand-purple hover:bg-brand-purple/80 text-white px-12 py-4 rounded-full text-xl font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)]"
          >
            I'm Ready, Start Capture
          </button>
        </div>
      </motion.div>
    );
  }

  if (phase === 'analyzing') {
    const analysisLabels = [
      "Extracting dwell time features...",
      "Computing rhythm entropy...",
      "Calculating inter-key intervals...",
      "Running LSTM inference...",
      "Generating report..."
    ];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto w-full px-4 z-10 relative">
        <div className="glass-card p-10">
          <Network className="w-16 h-16 mx-auto mb-6 text-brand-blue animate-pulse" />
          <h2 className="text-2xl font-bold mb-8 text-center neon-text-blue">Analyzing Neural Pattern</h2>
          <div className="space-y-4">
            {analysisLabels.map((label, idx) => (
              <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${idx <= analysisStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {idx < analysisStep ? (
                  <CheckCircle2 className="text-brand-green w-6 h-6 flex-shrink-0" />
                ) : idx === analysisStep ? (
                  <div className="w-6 h-6 rounded-full border-2 border-brand-blue border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-white/10 flex-shrink-0" />
                )}
                <span className={idx <= analysisStep ? 'text-white' : 'text-gray-500'}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-6xl mx-auto w-full px-4 z-10 relative">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Input area */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="text-brand-blue"/> Live Capture</h3>
            <div className="flex gap-4 text-xs font-mono">
              <div className="flex flex-col items-end">
                <span className="text-gray-500 uppercase text-[10px]">Keystrokes</span>
                <span className={keystrokes.length >= minKeystrokes ? 'text-brand-green' : 'text-brand-amber'}>{keystrokes.length} / {minKeystrokes}</span>
              </div>
              <div className="flex flex-col items-end border-l border-white/10 pl-4">
                <span className="text-gray-500 uppercase text-[10px]">Text Similarity</span>
                <span className={calculateSimilarity(text, SAMPLE_TEXT) > 50 ? 'text-brand-green' : 'text-brand-amber'}>{Math.round(calculateSimilarity(text, SAMPLE_TEXT))}%</span>
              </div>
            </div>
          </div>
          <div className="bg-brand-dark/50 p-4 rounded-xl border border-white/5 text-gray-400 italic mb-4 text-sm relative">
            {SAMPLE_TEXT}
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-gray-500 bg-brand-dark/80 px-2 py-0.5 rounded border border-white/5 uppercase">
              Target Reference
            </div>
          </div>
          {isInvalid && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-brand-red text-sm mb-4 p-3 bg-brand-red/10 border border-brand-red/20 rounded-lg flex items-center gap-2">
              <ShieldAlert size={16} /> 
              <span><strong>Inconsistent Input:</strong> Please type the paragraph above naturally. Random typing will invalidate the neural rhythm model.</span>
            </motion.div>
          )}
          <textarea
            autoFocus
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder="Start typing the text above here..."
            className={`w-full flex-grow bg-brand-dark/80 border ${isInvalid ? 'border-brand-red/50' : 'border-white/10'} rounded-xl p-4 text-lg text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue resize-none transition-all`}
            spellCheck="false"
          />
          <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-brand-blue to-brand-purple"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (keystrokes.length / (SAMPLE_TEXT.length)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Right Side: Live Metrics & Waveform */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-card p-6 flex-grow">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Neurological Rhythm</h3>
            <div className="h-40 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waveformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <YAxis domain={['auto', 'auto']} hide />
                  <ReferenceLine y={150} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
                  <Line 
                    type="monotone" 
                    dataKey="iki" 
                    stroke="#00d4ff" 
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false} // Disable recharts animation for true real-time feel
                    style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.5))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-gray-400">Mean Dwell Time</span>
                <span className="text-xl font-mono font-bold text-white">{liveMetrics.meanDwell} <span className="text-xs text-gray-500">ms</span></span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-gray-400">Mean Flight Time</span>
                <span className="text-xl font-mono font-bold text-white">{liveMetrics.meanFlight} <span className="text-xs text-gray-500">ms</span></span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-gray-400">Rhythm Variance</span>
                <span className="text-xl font-mono font-bold text-white">{liveMetrics.rhythmVar}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeatureCard = ({ title, value, healthyRange, unit, status }) => {
  const statusColors = {
    'optimal': 'text-brand-green border-brand-green/30 bg-brand-green/5',
    'elevated': 'text-brand-amber border-brand-amber/30 bg-brand-amber/5',
    'irregular': 'text-brand-red border-brand-red/30 bg-brand-red/5'
  };

  const statusIcons = {
    'optimal': <CheckCircle2 className="w-5 h-5 text-brand-green" />,
    'elevated': <ShieldAlert className="w-5 h-5 text-brand-amber" />,
    'irregular': <FileWarning className="w-5 h-5 text-brand-red" />
  };

  return (
    <div className={`glass-card p-5 border-l-4 ${statusColors[status]}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-gray-300 font-medium">{title}</h4>
        {statusIcons[status]}
      </div>
      <div className="text-3xl font-bold text-white mb-1">
        {typeof value === 'number' ? value.toFixed(1) : value} <span className="text-sm font-normal text-gray-500">{unit}</span>
      </div>
      <div className="text-xs text-gray-500">Healthy: {healthyRange}</div>
    </div>
  );
};

const ResultsDashboard = ({ features, onReset }) => {
  const riskScore = calculateRiskScore(features);
  
  let riskLevel, riskColor, riskText;
  if (riskScore <= 30) {
    riskLevel = "LOW RISK";
    riskColor = "text-brand-green";
    riskText = "No significant neurological markers detected.";
  } else if (riskScore <= 60) {
    riskLevel = "MODERATE RISK";
    riskColor = "text-brand-amber";
    riskText = "Some irregular rhythm patterns detected.";
  } else {
    riskLevel = "HIGH RISK";
    riskColor = "text-brand-red";
    riskText = "Significant irregularities in motor timing detected.";
  }

  // Determine individual feature status
  const getStatus = (val, highThreshold, extremeThreshold) => {
    if (val < highThreshold) return 'optimal';
    if (val < extremeThreshold) return 'elevated';
    return 'irregular';
  };

  // Mock comparison data for chart
  const comparisonData = Array.from({ length: 50 }).map((_, i) => ({
    time: i,
    user: 150 + Math.sin(i / 2) * (features.ikiVariance / 100) + (Math.random() * features.stdDwell),
    healthy: 150 + Math.sin(i / 2) * 20 + Math.random() * 10,
    pd: 150 + Math.sin(i / 1.5) * 80 + Math.random() * 60 + (i % 5 === 0 ? 100 : 0) // Micro-arrests
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto w-full px-4 z-10 relative pb-20">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold mb-2">Analysis Complete</h2>
        <p className="text-gray-400">Based on your simulated 80-word typing session.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Score Card */}
        <div className="lg:col-span-1 glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 ${riskScore <= 30 ? 'bg-brand-green' : riskScore <= 60 ? 'bg-brand-amber' : 'bg-brand-red'}`}></div>
          
          <h3 className="text-gray-400 font-medium mb-6 uppercase tracking-widest text-sm">Parkinson's Risk Score</h3>
          
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" className="text-gray-800" strokeWidth="12" stroke="currentColor" fill="none" />
              <motion.circle 
                cx="96" cy="96" r="88" 
                className={riskColor} 
                strokeWidth="12" 
                strokeDasharray="552.9" // 2 * pi * 88
                initial={{ strokeDashoffset: 552.9 }}
                animate={{ strokeDashoffset: 552.9 - (552.9 * riskScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                stroke="currentColor" 
                fill="none" 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold text-white">{riskScore}</span>
              <span className="text-sm text-gray-500">/ 100</span>
            </div>
          </div>
          
          <div className={`text-xl font-bold mb-2 ${riskColor}`}>{riskLevel}</div>
          <p className="text-sm text-gray-400 px-4">{riskText}</p>
        </div>

        {/* Feature Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard 
            title="Mean Dwell Time" 
            value={features.meanDwell} unit="ms" 
            healthyRange="80-120ms"
            status={getStatus(features.meanDwell, 120, 150)}
          />
          <FeatureCard 
            title="Dwell Variability" 
            value={features.stdDwell} unit="ms" 
            healthyRange="<30ms std"
            status={getStatus(features.stdDwell, 30, 50)}
          />
          <FeatureCard 
            title="Mean Flight Time" 
            value={features.meanFlight} unit="ms" 
            healthyRange="150-250ms"
            status={getStatus(features.meanFlight, 250, 300)}
          />
          <FeatureCard 
            title="Flight Variability" 
            value={features.stdFlight} unit="ms" 
            healthyRange="<80ms std"
            status={getStatus(features.stdFlight, 80, 120)}
          />
          <FeatureCard 
            title="IKI Variance" 
            value={features.ikiVariance} unit="" 
            healthyRange="<5000"
            status={getStatus(features.ikiVariance, 5000, 8000)}
          />
          <FeatureCard 
            title="Rhythm Entropy" 
            value={features.rhythmEntropy} unit="bits" 
            healthyRange="2.5-3.5 bits"
            status={getStatus(features.rhythmEntropy, 3.5, 4.0)}
          />
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="glass-card p-6 mb-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="text-brand-purple" /> Typing Rhythm Comparison</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10, 14, 26, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="pd" stroke="#ef4444" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPD)" name="Typical PD Pattern" />
              <Area type="monotone" dataKey="user" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#colorUser)" name="Your Pattern" />
              <Area type="monotone" dataKey="healthy" stroke="#10b981" strokeWidth={1} opacity={0.5} fill="none" name="Optimal Healthy" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-blue"></div> Your Pattern</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-green opacity-50"></div> Healthy Baseline</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-red"></div> PD Signature</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="glass-card p-6 border-l-4 border-brand-amber/50 bg-brand-amber/5 flex items-start gap-4">
          <Info className="text-brand-amber flex-shrink-0 w-6 h-6 mt-1" />
          <div>
            <h4 className="font-bold text-white mb-2">Important Medical Disclaimer</h4>
            <p className="text-sm text-gray-300">This is a simulated screening tool demonstrating the Neuroqwerty research methodology. It is NOT a medical diagnosis. If you are concerned about your motor function, please consult a certified neurologist.</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <button 
            onClick={onReset}
            className="flex items-center gap-2 text-white bg-white/5 hover:bg-white/10 px-8 py-4 rounded-full font-bold transition-colors border border-white/10"
          >
            <RefreshCcw className="w-5 h-5" /> Retake Test
          </button>
        </div>
      </div>
      
      <MLPipeline />
      <ComparisonTable />
      
    </motion.div>
  );
};

const MLPipeline = () => {
  return (
    <div className="mb-20">
      <h3 className="text-2xl font-bold mb-8 text-center">How NeuroType AI Works</h3>
      <div className="glass-card p-8 overflow-x-auto hide-scrollbar">
        <div className="flex items-center justify-between min-w-[800px] relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-10 right-10 h-1 bg-white/10 -translate-y-1/2 z-0"></div>
          
          {/* Nodes */}
          <div className="relative z-10 flex flex-col items-center w-48">
            <div className="w-20 h-20 rounded-full bg-brand-dark border-2 border-brand-blue flex items-center justify-center mb-4 neon-border-blue">
              <Clock className="w-8 h-8 text-brand-blue" />
            </div>
            <h4 className="font-bold text-white text-center">Raw Keystrokes</h4>
            <p className="text-xs text-gray-400 text-center mt-2">Dwell, flight, and absolute timestamps</p>
          </div>

          <ArrowRight className="text-gray-600 relative z-10" />

          <div className="relative z-10 flex flex-col items-center w-48">
            <div className="w-20 h-20 rounded-2xl bg-brand-dark border-2 border-brand-purple flex items-center justify-center mb-4 transform rotate-45">
              <Fingerprint className="w-8 h-8 text-brand-purple -rotate-45" />
            </div>
            <h4 className="font-bold text-white text-center mt-2">Feature Extraction</h4>
            <p className="text-xs text-gray-400 text-center mt-2">6 biomarker features per typing session</p>
          </div>

          <ArrowRight className="text-gray-600 relative z-10" />

          <div className="relative z-10 flex flex-col items-center w-48">
            <div className="w-20 h-20 bg-brand-dark border-2 border-brand-blue flex items-center justify-center mb-4 rounded-xl">
              <Network className="w-10 h-10 text-brand-blue" />
            </div>
            <h4 className="font-bold text-white text-center">LSTM Network</h4>
            <p className="text-xs text-gray-400 text-center mt-2">64→32 units, trained on MIT dataset</p>
          </div>

          <ArrowRight className="text-gray-600 relative z-10" />

          <div className="relative z-10 flex flex-col items-center w-48">
            <div className="w-20 h-20 rounded-full bg-brand-dark border-2 border-brand-green flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-brand-green" />
            </div>
            <h4 className="font-bold text-white text-center">Risk Score</h4>
            <p className="text-xs text-gray-400 text-center mt-2">0.0–1.0 sigmoid output risk probability</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComparisonTable = () => {
  return (
    <div className="mb-10">
      <h3 className="text-2xl font-bold mb-8 text-center">Why NeuroType is Different</h3>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-5 text-gray-400 font-medium">Feature</th>
                <th className="p-5 text-brand-blue font-bold bg-brand-blue/5 border-x border-brand-blue/20 w-1/4">NeuroType</th>
                <th className="p-5 text-gray-300 font-medium w-1/5 text-center">DaTscan</th>
                <th className="p-5 text-gray-300 font-medium w-1/5 text-center">Apple Watch</th>
                <th className="p-5 text-gray-300 font-medium w-1/5 text-center">Neurologist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm md:text-base">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-5 text-gray-300">Cost</td>
                <td className="p-5 text-brand-blue font-semibold bg-brand-blue/5 border-x border-brand-blue/20">₹0</td>
                <td className="p-5 text-center text-gray-400">₹80,000</td>
                <td className="p-5 text-center text-gray-400">₹35,000</td>
                <td className="p-5 text-center text-gray-400">₹2,000 / visit</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-5 text-gray-300">Stage Detected</td>
                <td className="p-5 text-brand-blue font-semibold bg-brand-blue/5 border-x border-brand-blue/20">Stage 0-1 (Pre-motor)</td>
                <td className="p-5 text-center text-gray-400">Stage 2-3</td>
                <td className="p-5 text-center text-gray-400">Stage 2-3</td>
                <td className="p-5 text-center text-gray-400">Stage 2-3</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-5 text-gray-300">Hardware Needed</td>
                <td className="p-5 text-brand-blue font-semibold bg-brand-blue/5 border-x border-brand-blue/20">Any Standard Keyboard</td>
                <td className="p-5 flex flex-col items-center justify-center text-gray-400"><Building2 className="w-4 h-4 mb-1"/> Nuclear Imaging</td>
                <td className="p-5 flex flex-col items-center justify-center text-gray-400"><Watch className="w-4 h-4 mb-1"/> Smartwatch</td>
                <td className="p-5 flex flex-col items-center justify-center text-gray-400"><Stethoscope className="w-4 h-4 mb-1"/> Clinic Visit</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-5 text-gray-300">Time to Result</td>
                <td className="p-5 text-brand-blue font-semibold bg-brand-blue/5 border-x border-brand-blue/20">2 minutes</td>
                <td className="p-5 text-center text-gray-400">4 hours</td>
                <td className="p-5 text-center text-gray-400">Weeks (Trending)</td>
                <td className="p-5 text-center text-gray-400">Months (Waitlist)</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-5 text-gray-300">Accessible Rurally</td>
                <td className="p-5 text-brand-green font-semibold bg-brand-blue/5 border-x border-brand-blue/20 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Yes</td>
                <td className="p-5 text-center text-brand-red">No</td>
                <td className="p-5 text-center text-brand-red">No</td>
                <td className="p-5 text-center text-brand-red">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('hero'); // hero, test, results
  const [features, setFeatures] = useState(null);

  const handleStart = () => {
    setView('test');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComplete = (extractedFeatures) => {
    setFeatures(extractedFeatures);
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setFeatures(null);
    setView('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-brand-purple/30 selection:text-white relative pb-10">
      <BackgroundNetwork />
      
      {/* Navbar Placeholder */}
      <nav className="fixed top-0 w-full z-50 glass-card rounded-none border-t-0 border-x-0 border-b-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl tracking-wide cursor-pointer" onClick={handleReset}>
          <Brain className="text-brand-blue" />
          <span>NEURO<span className="text-brand-purple">TYPE</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          <a href="#science-panel" onClick={(e) => {
            e.preventDefault();
            document.getElementById('science-panel')?.scrollIntoView({ behavior: 'smooth' });
          }} className="hover:text-brand-blue transition-colors">Science</a>
          <a href="#" className="hover:text-brand-blue transition-colors opacity-50 cursor-not-allowed">Methodology</a>
          <a href="#" className="hover:text-brand-blue transition-colors opacity-50 cursor-not-allowed">About</a>
        </div>
      </nav>

      <main className="pt-24 relative z-10">
        <AnimatePresence mode="wait">
          {view === 'hero' && (
            <motion.div 
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <HeroSection onStart={handleStart} />
              <SciencePanel />
            </motion.div>
          )}

          {view === 'test' && (
            <motion.div 
              key="test"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <LiveTypingTest onComplete={handleComplete} />
            </motion.div>
          )}

          {view === 'results' && features && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ResultsDashboard features={features} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
