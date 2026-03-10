import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";

export default function ProfessorDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  useEffect(() => {
    // 1. WebSocket connection setup to your API
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5162/monitoringHub", {
        // Important to avoid CORS errors with SignalR
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

        // 3. Listen for alerts! When the API broadcasts "ReceiveAlert", add it to the list
        newConnection.on("ReceiveAlert", (alertData) => {
          console.log("Alert received:", alertData);
          // Add the new alert to the top of the list
          setAlerts((prevAlerts) => [alertData, ...prevAlerts]);
        });
      })
      .catch((err) => {
        console.error("SignalR connection error: ", err);
        setConnectionStatus("🔴 Failed to connect to server");
      });

    // Cleanup when the professor leaves the page
    return () => {
      if (newConnection) {
        newConnection.stop();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-secureDark p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-white">
            Monitoring Dashboard (Zero-Trust)
          </h1>
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

        <div className="bg-white/5 border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-gray-800/50 border-b border-gray-700 font-semibold text-gray-300 grid grid-cols-4 gap-4">
            <div>Time</div>
            <div>Session ID</div>
            <div>Alert Type</div>
            <div>Anomaly Score (Z-Score)</div>
          </div>

          <div className="divide-y divide-gray-700/50 max-h-[600px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 italic">
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
      </div>
    </div>
  );
}
