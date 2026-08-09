import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Activity, ArrowLeft, Download, Loader2, ImagePlus, X } from "lucide-react";
import jsPDF from "jspdf";
import api from "./api";

function Predict() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    symptoms: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

  const removeImage = () => {
    setImageBase64(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post("/api/predict", {
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        symptoms: formData.symptoms,
        image_base64: imageBase64 || null,
      });
      setResult(res.data);
      toast.success("Prediction generated");
    } catch (err) {
      const message =
        err.response?.data?.detail || "Prediction failed. Try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("MedAI Prediction Report", 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
    y += 12;

    doc.setFontSize(13);
    doc.text("Patient Input", 20, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Age: ${formData.age}`, 20, y); y += 7;
    doc.text(`Gender: ${formData.gender}`, 20, y); y += 7;
    doc.text(`Symptoms: ${formData.symptoms}`, 20, y, { maxWidth: 170 }); y += 14;

    doc.setFontSize(13);
    doc.text("Prediction", 20, y); y += 8;
    doc.setFontSize(11);
    doc.text(`Predicted Condition: ${result.predicted_disease || "N/A"}`, 20, y, { maxWidth: 170 }); y += 8;
    doc.text(`Risk Level: ${result.risk_level || "N/A"}`, 20, y); y += 7;
    doc.text(`Confidence: ${result.confidence_percent || "N/A"}%`, 20, y); y += 10;

    if (result.symptom_analysis) {
      doc.setFontSize(12);
      doc.text("Analysis", 20, y); y += 7;
      doc.setFontSize(10);
      const analysisLines = doc.splitTextToSize(result.symptom_analysis, 170);
      doc.text(analysisLines, 20, y);
      y += analysisLines.length * 5 + 6;
    }

    if (result.recommendations?.length) {
      doc.setFontSize(12);
      doc.text("Recommendations", 20, y); y += 7;
      doc.setFontSize(10);
      result.recommendations.forEach((rec) => {
        const lines = doc.splitTextToSize(`• ${rec}`, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 2;
      });
      y += 4;
    }

    if (result.red_flags?.length) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Warning Signs (Seek Immediate Care)", 20, y); y += 7;
      doc.setFontSize(10);
      result.red_flags.forEach((flag) => {
        const lines = doc.splitTextToSize(`• ${flag}`, 170);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 2;
      });
      y += 4;
    }

    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.text(
      result.disclaimer ||
        "This report is AI-generated and not a substitute for professional medical advice.",
      20,
      y,
      { maxWidth: 170 }
    );

    doc.save("medai-prediction-report.pdf");
  };

  const riskColor = (result?.risk_level || "").toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex items-center justify-between px-8 py-5 bg-white shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="text-blue-600" size={26} />
          <span className="text-xl font-bold text-slate-800">MedAI</span>
        </Link>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition text-sm"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          New Prediction
        </h1>
        <p className="text-slate-500 mb-8 text-sm">
          Fill in the details below to get an AI-generated health prediction.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-sm space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Age
              </label>
              <input
                type="number"
                name="age"
                required
                min="0"
                max="120"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 34"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Symptoms
            </label>
            <textarea
              name="symptoms"
              required
              rows={4}
              value={formData.symptoms}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe symptoms, e.g. fatigue, frequent thirst, persistent cough..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Medical Image (optional)
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="h-32 rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg px-4 py-3 text-slate-500 text-sm cursor-pointer hover:border-blue-400 transition w-fit">
                <ImagePlus size={18} />
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Analyzing..." : "Get Prediction"}
          </button>
        </form>

        {result && (
          <div className="bg-white p-6 rounded-xl shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {result.predicted_disease}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  riskColor === "critical" || riskColor === "high"
                    ? "bg-red-100 text-red-700"
                    : riskColor === "moderate"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {result.risk_level}
              </span>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Confidence: {result.confidence_percent}%
            </p>

            {result.alternative_conditions?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Other Possible Conditions
                </p>
                <p className="text-sm text-slate-600">
                  {result.alternative_conditions.join(", ")}
                </p>
              </div>
            )}

            {result.symptom_analysis && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Analysis
                </p>
                <p className="text-sm text-slate-600">
                  {result.symptom_analysis}
                </p>
              </div>
            )}

            {result.recommendations?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Recommendations
                </p>
                <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.red_flags?.length > 0 && (
              <div className="mb-4 bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-700 mb-1">
                  Seek Immediate Care If You Notice
                </p>
                <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
                  {result.red_flags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-slate-400 italic mb-4">
              {result.disclaimer}
            </p>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 text-blue-600 font-medium hover:underline text-sm"
            >
              <Download size={16} />
              Download PDF Report
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Predict;