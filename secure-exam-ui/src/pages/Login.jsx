import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Remplace l'URL par celle de ton API .NET
      const response = await api.post("/Auth/login", { email, password });
      localStorage.setItem("jwtToken", response.data.token);
      navigate("/exam"); // Redirige vers la salle d'examen
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Identifiants incorrects ou problème réseau.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Secure Exam</h2>
          <p className="text-gray-300">Portail d'authentification Zero-Trust</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-black/20 border border-gray-600 rounded-lg focus:outline-none focus:border-secureAccent text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 bg-black/20 border border-gray-600 rounded-lg focus:outline-none focus:border-secureAccent text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-secureAccent hover:bg-emerald-400 text-gray-900 font-bold rounded-lg transition-colors duration-200"
          >
            Accéder à la session
          </button>
        </form>
      </div>
    </div>
  );
}
