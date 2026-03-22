import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig"; // Ensure this path is correct for your project

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await api.post("/Auth/login", { email, password });
      
      // 1. Extract the data from the C# response
      const { token, role, email: userEmail, cohort, formations } = response.data;

      // 2. Save the Zero-Trust Token
      localStorage.setItem("jwtToken", token);
      
      // 3. Save the User Profile so dashboards know who is logged in
      const userProfile = { role, email: userEmail, cohort, formations };
      localStorage.setItem("userProfile", JSON.stringify(userProfile));

      // 4. Role-Based Routing (Traffic Cop)
      if (role === "Admin") {
        navigate("/admin");
      } else if (role === "Professor") {
        navigate("/dashboard");
      } else {
        navigate("/student"); // Or "/exam" depending on your route name
      }
      
    } catch (err) {
      console.error(err);
      setError("Identifiants incorrects ou problème réseau.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d1117]">
      <div className="max-w-md w-full bg-[#161b22] rounded-2xl p-8 shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">SecureExam</h2>
          <p className="text-gray-400">Portail d'authentification Zero-Trust</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-[#0d1117] border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Mot de passe</label>
            <input
              type="password"
              className="w-full px-4 py-2 bg-[#0d1117] border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors duration-200 shadow-lg"
          >
            Accéder à la session
          </button>
        </form>
      </div>
    </div>
  );
}