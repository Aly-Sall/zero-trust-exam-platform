import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import ExamCalendar from "../../components/ExamCalender/ExamCalendar";
import ExamRepository from "../../components/QuestionBankBuilder/ExamRepository";
import ScheduleExamModal from "../../components/ScheduleExamModal/ScheduleExamModal";

export default function ProfessorDashboard() {
  const rawProfile = JSON.parse(localStorage.getItem("userProfile")) || {};

  let safeFormations = [];
  if (Array.isArray(rawProfile.formations)) {
    safeFormations = rawProfile.formations;
  } else if (typeof rawProfile.formations === 'string' && rawProfile.formations.length > 2) {
    try {
      safeFormations = JSON.parse(rawProfile.formations);
    } catch (e) {
      safeFormations = rawProfile.formations.replace(/[\[\]"]/g, '').split(',').map(s => s.trim());
    }
  }

  const currentUser = { ...rawProfile, formations: safeFormations };

  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [isScheduling, setIsScheduling] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  
  // 🟢 NEW: State to hold the REAL database question banks
  const [availableBanks, setAvailableBanks] = useState([]);

  // 🟢 NEW: Fetch the actual question banks from C# SQLite
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch("http://localhost:5162/api/exams/banks");
        if (response.ok) {
          const data = await response.json();
          setAvailableBanks(data); // Save real data to state
        }
      } catch (error) {
        console.error("Failed to load question banks from database", error);
      }
    };
    
    fetchBanks();
  }, []);

  // SignalR WebSocket Connection
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5162/monitoringHub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => {
        setConnectionStatus("🟢 Connected to monitoring server (Live)");
        newConnection.on("ReceiveAlert", (alertData) => {
          setAlerts((prevAlerts) => [alertData, ...prevAlerts]);
        });
      })
      .catch(() => setConnectionStatus("🔴 Failed to connect to server"));

    return () => { if (newConnection) newConnection.stop(); };
  }, []);

  const handleScheduleSubmit = async (formData) => {
    try {
      const response = await fetch("http://localhost:5162/api/exams/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsScheduling(false);
        alert("Exam scheduled! The backend will now generate random versions for the students.");
        setCalendarKey(prev => prev + 1);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Failed to save exam"}`);
      }
    } catch (error) {
      alert("Could not connect to the backend server. Is it running?");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-8 text-white relative space-y-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-white">Monitoring Dashboard (Zero-Trust)</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsScheduling(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
              📅 Schedule Exam
            </button>
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${connectionStatus.includes("🟢") ? "bg-green-500/20 text-green-400 border border-green-500" : "bg-red-500/20 text-red-400 border border-red-500"}`}>
              {connectionStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#161b22] border border-gray-700 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full">
            <div className="p-4 bg-gray-800/50 border-b border-gray-700 font-semibold text-gray-300 grid grid-cols-4 gap-4">
              <div>Time</div><div>Session ID</div><div>Alert Type</div><div>Anomaly Score (Z-Score)</div>
            </div>
            <div className="divide-y divide-gray-700/50 max-h-[600px] overflow-y-auto flex-grow">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic mt-10">No incidents detected. Sessions are secure.</div>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={idx} className="p-4 grid grid-cols-4 gap-4 items-center bg-red-500/10 hover:bg-red-500/20 animate-pulse">
                    <div className="text-gray-400">{alert.time}</div>
                    <div className="font-mono text-white">#{alert.sessionId}</div>
                    <div className="text-red-400 font-bold">⚠️ {alert.type}</div>
                    <div className="font-mono text-red-300 font-bold bg-red-900/50 px-3 py-1 rounded inline-block w-max border border-red-700">{alert.score.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <ExamCalendar key={calendarKey} />
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <ExamRepository />
      </div>

      {isScheduling && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#161b22] border border-gray-600 rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-700 pb-2">📅 Schedule Zero-Trust Exam</h2>
            
            <ScheduleExamModal
              professorProfile={currentUser} 
              availableBanks={availableBanks} // 🟢 NO MORE MOCK DATA! This is pure SQLite data now.
              onSchedule={handleScheduleSubmit}
              onCancel={() => setIsScheduling(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}