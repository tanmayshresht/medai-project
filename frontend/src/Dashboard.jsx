import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Activity, LogOut, PlusCircle, Clock, User } from "lucide-react";
import api from "./api";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchHistory = async () => {
      try {
        const res = await api.get("/api/predictions");
        setHistory(res.data || []);
      } catch (err) {
        toast.error("Could not load prediction history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex items-center justify-between px-8 py-5 bg-white shadow-sm">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="text-blue-600" size={26} />
          <span className="text-xl font-bold text-slate-800">MedAI</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8 bg-white p-6 rounded-xl shadow-sm">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="text-blue-600" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Welcome{user?.name ? `, ${user.name}` : ""}
            </h1>
            <p className="text-slate-500 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Prediction History
          </h2>
          <Link
            to="/predict"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <PlusCircle size={18} />
            New Prediction
          </Link>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading history...</p>
        ) : history.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <p className="text-slate-500 mb-4">No predictions yet.</p>
            <Link
              to="/predict"
              className="text-blue-600 font-medium hover:underline"
            >
              Make your first prediction
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, idx) => {
              const risk = (item.result?.risk_level || "").toLowerCase();
              return (
                <div
                  key={item.id || idx}
                  className="bg-white p-5 rounded-xl shadow-sm flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {item.result?.predicted_disease || "Prediction"}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {item.symptoms}
                    </p>
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                      <Clock size={14} />
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      risk === "critical" || risk === "high"
                        ? "bg-red-100 text-red-700"
                        : risk === "moderate"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.result?.risk_level || "N/A"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;