import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Activity, ShieldCheck, Stethoscope, Cpu, Database, 
  Mail, Github, Linkedin, ArrowRight, CheckCircle2, AlertCircle, 
  Upload, Sparkles, Layers, Zap, BarChart2, Globe, FlaskConical, 
  Image as ImageIcon, MessageSquare, X, Send
} from "lucide-react";
import api from "./api";
import { toast } from "sonner";

function Home() {
  const [formData, setFormData] = useState({ age: "", gender: "male", symptoms: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Hello! I am MedAI Assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/api/predict", {
        age: parseInt(formData.age, 10) || 30,
        gender: formData.gender || "male",
        symptoms: formData.symptoms,
        image_base64: imageBase64 || null,
      });
      setResult(res.data);
      toast.success("Prediction generated successfully");
    } catch (err) {
      toast.error("Prediction failed. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.post("/api/chat", {
        session_id: "public_session",
        message: userMsg,
      });
      setChatMessages((prev) => [...prev, { role: "assistant", text: res.data.reply }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I am having trouble connecting to the server right now." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 scroll-smooth relative">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-xl text-white">
            <Activity size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">MedAI</span>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium ml-1">MULTI-MODAL DIAGNOSTICS</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
          <a href="#home" className="hover:text-emerald-600 transition">Home</a>
          <a href="#about" className="hover:text-emerald-600 transition">About</a>
          <a href="#predict" className="hover:text-emerald-600 transition">Predict</a>
          <a href="#features" className="hover:text-emerald-600 transition">Features</a>
          <a href="#pipeline" className="hover:text-emerald-600 transition">Pipeline</a>
          <a href="#dataset" className="hover:text-emerald-600 transition">Dataset</a>
          <a href="#metrics" className="hover:text-emerald-600 transition">Metrics</a>
          <a href="#contact" className="hover:text-emerald-600 transition">Contact</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-emerald-600 transition">Sign in</Link>
          <Link to="/register" className="px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-sm transition">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative px-6 pt-16 pb-24 overflow-hidden bg-gradient-to-b from-emerald-50/50 via-teal-50/20 to-transparent">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-6">
              <Sparkles size={14} /> Final-Year Research Project · Multi-Modal AI
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              A Multi-Modal AI Framework for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Early Disease Detection</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Early Disease Detection through AI-Powered Symptom Analysis and Medical Image Classification — combining NLP and Deep Learning for confident, explainable predictions.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <a href="#predict" className="px-6 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition flex items-center gap-2">
                Get Started <ArrowRight size={18} />
              </a>
              <a href="#about" className="px-6 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition">
                Learn More
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-100 h-[420px] bg-slate-900">
              <img 
                src="/images/doctor-with-tablet.png" 
                alt="Doctor with Tablet" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Project Section */}
      <section id="about" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-100 h-[400px] bg-slate-900">
            <img 
              src="/images/about-robot-hand.png" 
              alt="Robotic Hand AI" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">About the Project</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-3 mb-4">Closing the gap between symptoms and early diagnosis</h2>
            <p className="text-slate-600 mb-8 leading-relaxed text-sm">
              Diseases detected early have dramatically better outcomes — yet most diagnostic tools analyse one modality at a time. This framework fuses Natural Language Processing on patient-reported symptoms with deep-learning-based medical image classification to produce calibrated, explainable predictions that assist clinicians in the earliest stages of triage.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-emerald-600 uppercase mb-1">Problem</p><p className="text-xs text-slate-600">Single-modality systems miss subtle early signals.</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-emerald-600 uppercase mb-1">Objective</p><p className="text-xs text-slate-600">Fuse NLP + vision into one prediction pipeline.</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-emerald-600 uppercase mb-1">Why It Matters</p><p className="text-xs text-slate-600">Earlier detection = better outcomes &amp; lower cost.</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-emerald-600 uppercase mb-1">Innovation</p><p className="text-xs text-slate-600">Hybrid feature-fusion improves accuracy &amp; robustness.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">Features</span>
          <h2 className="text-4xl font-extrabold text-slate-900 mt-3">What makes MedAI different</h2>
          <p className="text-slate-600 mt-2">Designed for accuracy, explainability and clinician trust.</p>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Stethoscope size={24} /></div><h3 className="text-lg font-bold text-slate-900 mb-2">Symptom-Based Prediction</h3><p className="text-sm text-slate-600">Advanced NLP interprets free-text symptom descriptions into clinical features.</p></div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Upload size={24} /></div><h3 className="text-lg font-bold text-slate-900 mb-2">Medical Image Classification</h3><p className="text-sm text-slate-600">CNN-based analysis of X-ray, MRI, CT and dermoscopic images.</p></div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><BarChart2 size={24} /></div><h3 className="text-lg font-bold text-slate-900 mb-2">AI Confidence Score</h3><p className="text-sm text-slate-600">Calibrated probability with uncertainty awareness.</p></div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Layers size={24} /></div><h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Modal Analysis</h3><p className="text-sm text-slate-600">Feature fusion of text + image signals for stronger predictions.</p></div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Zap size={24} /></div><h3 className="text-lg font-bold text-slate-900 mb-2">Fast Predictions</h3><p className="text-sm text-slate-600">Inference completes in seconds, ready for clinical triage.</p></div>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Globe size={24} /></div><h3 className="text-lg font-bold text-slate-900 mb-2">User-Friendly Interface</h3><p className="text-sm text-slate-600">Designed for clinicians, researchers, and patients.</p></div>
        </div>
      </section>

      {/* Five-step Pipeline */}
      <section id="pipeline" className="py-20 px-6 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">How It Works</span>
          <h2 className="text-4xl font-extrabold text-slate-900 mt-3">A five-step multi-modal pipeline</h2>
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center"><div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl mx-auto flex items-center justify-center font-bold mb-4">1</div><h3 className="font-bold text-slate-900 mb-2">Enter Symptoms</h3><p className="text-xs text-slate-500">Describe symptoms in natural language.</p></div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center"><div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl mx-auto flex items-center justify-center font-bold mb-4">2</div><h3 className="font-bold text-slate-900 mb-2">Upload Medical Image</h3><p className="text-xs text-slate-500">X-ray, MRI, CT, or skin photo (optional).</p></div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center"><div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl mx-auto flex items-center justify-center font-bold mb-4">3</div><h3 className="font-bold text-slate-900 mb-2">AI Processing</h3><p className="text-xs text-slate-500">NLP + CNN multi-modal inference.</p></div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center"><div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl mx-auto flex items-center justify-center font-bold mb-4">4</div><h3 className="font-bold text-slate-900 mb-2">Disease Prediction</h3><p className="text-xs text-slate-500">Most likely condition + differentials.</p></div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center"><div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl mx-auto flex items-center justify-center font-bold mb-4">5</div><h3 className="font-bold text-slate-900 mb-2">Confidence &amp; Plan</h3><p className="text-xs text-slate-500">Risk level + actionable recommendations.</p></div>
        </div>
      </section>

      {/* Live Prediction Module */}
      <section id="predict" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">Try It</span>
          <h2 className="text-4xl font-extrabold text-slate-900 mt-3">Run a live multi-modal prediction</h2>
          <p className="text-slate-600 mt-2">Combine symptoms with a medical image and let the AI return a calibrated assessment.</p>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 bg-slate-50 border border-slate-200/80 p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="text-emerald-500" size={24} />
              <h3 className="text-xl font-bold text-slate-900">Disease Prediction Module</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
                  <input type="number" required min="1" max="120" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} placeholder="e.g., 34" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                  <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Symptoms</label>
                <textarea required rows={4} value={formData.symptoms} onChange={(e) => setFormData({...formData, symptoms: e.target.value})} placeholder="Describe your symptoms (e.g., persistent dry cough for 5 days, mild fever, fatigue, chest tightness)" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Medical Image (optional)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-white hover:border-emerald-400 transition cursor-pointer">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-32 rounded-lg mx-auto" />
                      <button type="button" onClick={() => {setImagePreview(null); setImageBase64(null);}} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-xs">✕</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="mx-auto text-slate-400 mb-2" size={28} />
                      <p className="text-sm font-medium text-slate-700">Drop X-ray, MRI, CT scan or skin image</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP · max 8MB</p>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? "Analyzing Multi-Modal Data..." : "Predict Disease"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 bg-slate-50 border border-slate-200/80 p-8 rounded-3xl shadow-sm min-h-[500px] flex flex-col justify-center items-center text-center">
            {result ? (
              <div className="w-full text-left bg-white p-6 rounded-2xl border border-emerald-100 shadow-md">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900">{result.predicted_disease}</h3>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold uppercase">Risk: {result.risk_level} ({result.confidence_percent}%)</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{result.symptom_analysis}</p>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Recommendations</h4>
                <ul className="text-sm text-slate-700 list-disc list-inside space-y-1 mb-4">
                  {result.recommendations?.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
                <p className="text-xs text-slate-400 italic">{result.disclaimer}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl mx-auto flex items-center justify-center"><ImageIcon size={32} /></div>
                <h3 className="font-bold text-slate-900 text-lg">Results will appear here</h3>
                <p className="text-sm text-slate-400 max-w-xs">Predicted condition, confidence, and recommendations.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI Technologies */}
      <section className="py-16 bg-slate-50/50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">AI Technologies</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3">Built on a modern AI stack</h2>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-3">
          {["OpenCV", "Scikit-Learn", "PyTorch", "Transformers", "ResNet", "Python", "Machine Learning", "Deep Learning", "TensorFlow", "CNN"].map((tech, i) => (
            <div key={i} className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm text-sm font-semibold text-slate-700"><Cpu size={16} className="text-emerald-500" /> {tech}</div>
          ))}
        </div>
      </section>

      {/* Dataset */}
      <section id="dataset" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">Dataset</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-3">Data foundation</h2>
            <p className="text-slate-600 mt-2">Public clinical datasets combined and preprocessed for robust training and validation.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><Database className="text-emerald-500 mb-4" size={28} /><h3 className="font-bold text-slate-900 mb-1">Symptom Dataset</h3><p className="text-xs text-slate-600">Disease-symptom corpus with 4,920 labeled records across 41 diseases.</p></div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><Stethoscope className="text-emerald-500 mb-4" size={28} /><h3 className="font-bold text-slate-900 mb-1">Medical Image Dataset</h3><p className="text-xs text-slate-600">Curated X-ray, MRI, CT and dermoscopy images with diagnostic labels.</p></div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><FlaskConical className="text-emerald-500 mb-4" size={28} /><h3 className="font-bold text-slate-900 mb-1">Preprocessing</h3><p className="text-xs text-slate-600">Tokenization, lemmatization, image resizing (224×224), normalization &amp; augmentation.</p></div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100"><Layers className="text-emerald-500 mb-4" size={28} /><h3 className="font-bold text-slate-900 mb-1">Train/Test Split</h3><p className="text-xs text-slate-600">Stratified 80/10/10 train-validation-test split with 5-fold CV.</p></div>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section id="metrics" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">Performance Metrics</span>
          <h2 className="text-4xl font-extrabold text-slate-900 mt-3">Strong, balanced results</h2>
        </div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg">Metric Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase">Accuracy</p><p className="text-3xl font-extrabold text-slate-900 mt-1">94.7%</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase">Precision</p><p className="text-3xl font-extrabold text-slate-900 mt-1">93.2%</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase">Recall</p><p className="text-3xl font-extrabold text-slate-900 mt-1">92.8%</p></div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase">F1 Score</p><p className="text-3xl font-extrabold text-slate-900 mt-1">93%</p></div>
            </div>

            <div className="pt-10 pb-6 flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 flex items-center justify-center">
                <span className="absolute -top-6 text-xs font-bold text-slate-700 tracking-wide">Accuracy</span>
                <span className="absolute -right-12 text-xs font-bold text-slate-700 tracking-wide">Precision</span>
                <span className="absolute -bottom-6 text-xs font-bold text-slate-700 tracking-wide">Recall</span>
                <span className="absolute -left-12 text-xs font-bold text-slate-700 tracking-wide">F1 Score</span>

                <div className="w-32 h-32 rotate-45 border border-emerald-400 bg-emerald-200/40 relative flex items-center justify-center shadow-sm">
                  <div className="absolute inset-2 border border-emerald-300/50 bg-emerald-100/30"></div>
                  <div className="absolute inset-4 border border-emerald-300/40 bg-emerald-50/25"></div>
                  <div className="absolute inset-6 border border-emerald-200/30"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-8">
            <div>
              <h3 className="font-bold text-slate-900 text-lg mb-6">Confusion Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="text-slate-400 font-semibold"><td></td><td className="p-2">Pneumonia</td><td className="p-2">COVID-19</td><td className="p-2">Tuberculosis</td><td className="p-2">Normal</td></tr>
                  </thead>
                  <tbody className="space-y-2 text-slate-700 font-medium">
                    <tr><td className="text-left font-semibold text-slate-400 pr-2">Pneumonia</td><td className="p-2 bg-emerald-500 text-white rounded-xl">142</td><td className="p-2 bg-slate-50 rounded-xl">4</td><td className="p-2 bg-slate-50 rounded-xl">2</td><td className="p-2 bg-slate-50 rounded-xl">1</td></tr>
                    <tr><td className="text-left font-semibold text-slate-400 pr-2 pt-2">COVID-19</td><td className="p-2 bg-slate-50 rounded-xl">3</td><td className="p-2 bg-emerald-500 text-white rounded-xl">138</td><td className="p-2 bg-slate-50 rounded-xl">5</td><td className="p-2 bg-slate-50 rounded-xl">2</td></tr>
                    <tr><td className="text-left font-semibold text-slate-400 pr-2 pt-2">Tuberculosis</td><td className="p-2 bg-slate-50 rounded-xl">2</td><td className="p-2 bg-slate-50 rounded-xl">4</td><td className="p-2 bg-emerald-500 text-white rounded-xl">135</td><td className="p-2 bg-slate-50 rounded-xl">3</td></tr>
                    <tr><td className="text-left font-semibold text-slate-400 pr-2 pt-2">Normal</td><td className="p-2 bg-slate-50 rounded-xl">1</td><td className="p-2 bg-slate-50 rounded-xl">2</td><td className="p-2 bg-slate-50 rounded-xl">3</td><td className="p-2 bg-emerald-500 text-white rounded-xl">140</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <div className="h-44 flex items-end justify-between gap-4 px-4 pt-6 pb-2 relative border-b border-l border-slate-300">
                <div className="absolute -left-8 top-0 text-[10px] text-slate-400">100</div>
                <div className="absolute -left-8 top-10 text-[10px] text-slate-400">95</div>
                <div className="absolute -left-8 top-20 text-[10px] text-slate-400">90</div>
                <div className="absolute -left-8 top-30 text-[10px] text-slate-400">85</div>
                <div className="absolute -left-8 bottom-0 text-[10px] text-slate-400">80</div>
                <div className="w-full bg-sky-500 rounded-t-xl h-[94%] shadow-sm"></div>
                <div className="w-full bg-sky-500 rounded-t-xl h-[92%] shadow-sm"></div>
                <div className="w-full bg-sky-500 rounded-t-xl h-[91%] shadow-sm"></div>
                <div className="w-full bg-sky-500 rounded-t-xl h-[93%] shadow-sm"></div>
              </div>
              <div className="grid grid-cols-4 text-center text-xs font-semibold text-slate-600 mt-2">
                <span>Accuracy</span><span>Precision</span><span>Recall</span><span>F1 Score</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section ("Built by") */}
      <section className="py-20 px-6 bg-white text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">Team</span>
        <h2 className="text-4xl font-extrabold text-slate-900 mt-3 mb-12">Built by</h2>
        <div className="max-w-sm mx-auto bg-slate-50 p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold mb-4 shadow-md shadow-emerald-500/20">
            TS
          </div>
          <h3 className="text-xl font-bold text-slate-900">Tanmay Shresht</h3>
          <p className="text-sm text-slate-500 mt-1">Computer Science Engineering</p>
          <p className="text-xs font-medium text-emerald-600 mt-2">Sathyabama Institute of Science and Technology</p>
        </div>
      </section>

      {/* Let's Connect & Medical Disclaimer */}
      <section id="contact" className="py-20 px-6 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">Contact</span>
          <h2 className="text-4xl font-extrabold text-slate-900 mt-3 mb-12">Let's connect</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-left flex items-center gap-4 shadow-sm"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0"><Mail size={22} /></div><div className="overflow-hidden"><p className="text-xs font-bold text-slate-400 uppercase">Email</p><p className="text-sm font-semibold text-slate-800 truncate">tanmay.shresht@example.com</p></div></div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-left flex items-center gap-4 shadow-sm"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0"><Linkedin size={22} /></div><div className="overflow-hidden"><p className="text-xs font-bold text-slate-400 uppercase">LinkedIn</p><p className="text-sm font-semibold text-slate-800 truncate">linkedin.com/in/tanmay-shresht</p></div></div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 text-left flex items-center gap-4 shadow-sm"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0"><Github size={22} /></div><div className="overflow-hidden"><p className="text-xs font-bold text-slate-400 uppercase">GitHub</p><p className="text-sm font-semibold text-slate-800 truncate">github.com/tanmay-shresht</p></div></div>
          </div>
          <div className="bg-amber-50 border border-amber-200/60 p-6 rounded-3xl flex items-start gap-4 text-left shadow-sm">
            <div className="text-amber-600 mt-0.5"><ShieldCheck size={24} /></div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm mb-1">Medical Disclaimer</h4>
              <p className="text-xs text-amber-800/80 leading-relaxed">MedAI is an academic research and educational tool. It does not provide medical diagnosis, treatment, or replace consultation with qualified healthcare professionals. Always seek the advice of a physician for any medical condition.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-12">
          <div><div className="flex items-center gap-2 text-white mb-4"><Activity className="text-emerald-400" size={24} /><span className="text-lg font-bold">MedAI</span></div><p className="text-sm">A Multimodal AI-based Framework for Early Disease Detection using Symptom Analysis and Medical Image Classification.</p></div>
          <div><h4 className="text-white font-semibold mb-4 text-sm uppercase">Project</h4><div className="space-y-2 text-sm"><a href="#about" className="block hover:text-white transition">About</a><a href="#features" className="block hover:text-white transition">Features</a><a href="#metrics" className="block hover:text-white transition">Performance</a><a href="#dataset" className="block hover:text-white transition">Team</a></div></div>
          <div><h4 className="text-white font-semibold mb-4 text-sm uppercase">Connect</h4><div className="space-y-1 text-sm"><p className="text-slate-300">tanmay.shresht@example.com</p><a href="https://linkedin.com" target="_blank" rel="noreferrer" className="block hover:text-white transition">linkedin.com/in/tanmay-shresht</a><a href="https://github.com" target="_blank" rel="noreferrer" className="block hover:text-white transition">github.com/tanmay-shresht</a></div></div>
          <div><h4 className="text-white font-semibold mb-4 text-sm uppercase">Medical Disclaimer</h4><p className="text-xs text-slate-400 leading-relaxed">This is an academic research tool. It does not provide medical diagnosis, treatment, or replace consultation with qualified healthcare providers. Always seek the advice of a physician for any medical condition.</p></div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-center text-xs text-slate-500">© 2026 MedAI · Tanmay Shresht · Sathyabama Institute of Science and Technology</div>
      </footer>

      {/* Floating Ask MedAI Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {chatOpen && (
          <div className="mb-4 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[500px]">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-sm"><Sparkles size={20} /></div>
                <div><h3 className="font-bold text-slate-900 text-sm">MedAI Assistant</h3><p className="text-[11px] text-slate-500 font-medium">Healthcare AI · educational</p></div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-slate-700 p-1"><X size={18} /></button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 text-sm">
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-white text-slate-700 border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm text-xs leading-relaxed">
                  Hi! I'm MedAI Assistant. Ask me about symptoms, how this platform works, or general health topics. (Educational use only.)
                </div>
              </div>
              {chatMessages.map((msg, idx) => {
                if (idx === 0) return null;
                return (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === "user" ? "bg-sky-500 text-white rounded-br-none shadow-sm" : "bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-sm"}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              {chatLoading && (
                <div className="flex justify-start"><div className="bg-white text-slate-400 border border-slate-100 px-4 py-3 rounded-2xl text-xs rounded-bl-none shadow-sm animate-pulse">MedAI is typing...</div></div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about a symptom, condition..." className="flex-1 px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition" />
              <button type="submit" className="bg-emerald-500 text-white w-10 h-10 rounded-2xl hover:bg-emerald-600 transition flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20"><Send size={16} /></button>
            </form>
          </div>
        )}

        <button onClick={() => setChatOpen(!chatOpen)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3.5 rounded-full shadow-xl shadow-emerald-500/30 font-bold text-sm transition transform hover:scale-105">
          <MessageSquare size={18} /> Ask MedAI
        </button>
      </div>
    </div>
  );
}

export default Home;