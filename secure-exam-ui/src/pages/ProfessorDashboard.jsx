import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import ExamForm from "../../components/ExamForm/ExamForm";
import ExamCalendar from "../../components/ExamCalender/ExamCalendar";

export default function ProfessorDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  
  // State to control whether the "Schedule Exam" modal is open or closed
  const [isScheduling, setIsScheduling] = useState(false);

  // NEW: State to force the calendar to refresh when a new exam is added
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => {
    // 1. WebSocket connection setup to your API
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5162/monitoringHub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    // 2. Start connection
    newConnection
      .start()
      .then(() => {
        setConnectionStatus("🟢 Connected to monitoring server (Live)");

        // 3. Listen for alerts
        newConnection.on("ReceiveAlert", (alertData) => {
          console.log("Alert received:", alertData);
          setAlerts((prevAlerts) => [alertData, ...prevAlerts]);
        });
      })
      .catch((err) => {
        console.error("SignalR connection error: ", err);
        setConnectionStatus("🔴 Failed to connect to server");
      });

    // Cleanup
    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  const handleScheduleSubmit = async (formData) => {
    console.log("Sending exam to backend:", formData);

    try {
      const response = await fetch("http://localhost:5162/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Success:", result);
        
        // Close the modal and show success
        setIsScheduling(false);
        alert("Exam scheduled successfully in the database!");
        
        // NEW: Tell the ExamCalendar to fetch the updated list from the database
        setCalendarKey(prev => prev + 1);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Failed to save exam"}`);
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Could not connect to the backend server. Is it running?");
    }
  };

  return (
    <div className="min-h-screen bg-secureDark p-8 text-white relative">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-white">
            Monitoring Dashboard (Zero-Trust)
          </h1>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsScheduling(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
            >
              📅 Schedule Exam
            </button>

            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                connectionStatus.includes("🟢")
                  ? "bg-green-500/20 text-green-400 border border-green-500"
                  : "bg-red-500/20 text-red-400 border border-red-500"
              }`}
            >
              {connectionStatus}
            </span>
          </div>
        </div>

        {/* GRID LAYOUT (Alerts on Left, Calendar on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ALERTS TABLE SECTION (Takes 2 Columns) */}
          <div className="lg:col-span-2 bg-white/5 border border-gray-700 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full">
            <div className="p-4 bg-gray-800/50 border-b border-gray-700 font-semibold text-gray-300 grid grid-cols-4 gap-4">
              <div>Time</div>
              <div>Session ID</div>
              <div>Alert Type</div>
              <div>Anomaly Score (Z-Score)</div>
            </div>
            
            <div className="divide-y divide-gray-700/50 max-h-[600px] overflow-y-auto flex-grow">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic mt-10">
                  No incidents detected. Sessions are secure.
                </div>
              ) : (
                alerts.map((alert, index) => (
                  <div
                    key={index}
                    className="p-4 grid grid-cols-4 gap-4 items-center bg-red-500/10 hover:bg-red-500/20 transition-colors animate-pulse"
                  >
                    <div className="text-gray-400">{alert.time}</div>
                    <div className="font-mono text-white">#{alert.sessionId}</div>
                    <div className="text-red-400 font-bold flex items-center">
                      ⚠️ {alert.type}
                    </div>
                    <div className="font-mono text-red-300 font-bold bg-red-900/50 px-3 py-1 rounded inline-block w-max border border-red-700">
                      {alert.score.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* EXAM CALENDAR SECTION (Takes 1 Column) */}
          <div className="lg:col-span-1">
             {/* The key prop forces it to re-render when a new exam is scheduled */}
            <ExamCalendar key={calendarKey} />
          </div>

        </div>
      </div>
        
      {/* The Scheduling Modal */}
      {isScheduling && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-600 rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-700 pb-2">
              Create New Exam
            </h2>
            <ExamForm
              onSubmit={handleScheduleSubmit}
              onCancel={() => setIsScheduling(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}