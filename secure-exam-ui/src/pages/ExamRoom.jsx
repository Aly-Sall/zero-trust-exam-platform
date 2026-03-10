import { useState, useEffect } from "react";
import useKeystrokeDynamics from "../hooks/useKeystrokeDynamics";
import api from "../api/axiosConfig";

const examQuestions = [
  "Question 1 : Expliquez le concept de Zero-Trust Architecture.",
  "Question 2 : Quelles sont les différences entre le chiffrement symétrique et asymétrique ?",
  "Question 3 : Décrivez le fonctionnement d'une attaque par injection SQL et comment s'en prémunir.",
  "Question 4 : Quel est le rôle d'un SIEM dans un Centre Opérationnel de Sécurité (SOC) ?",
  "Question 5 : Expliquez le principe de la biométrie comportementale dans l'authentification.",
];

export default function ExamRoom() {
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");

  // NOUVEAUX ÉTATS POUR LA MODALE PERSONNALISÉE (Remplace window.confirm)
  const [showModal, setShowModal] = useState(false);
  const [pendingTargetIndex, setPendingTargetIndex] = useState(null);
  const [isFinishingPrompt, setIsFinishingPrompt] = useState(false);

  const { handleKeyDown, handleKeyUp, getKeystrokeData, clearKeystrokeData } =
    useKeystrokeDynamics();

  // --- 1. Gestion du Browser Lockdown ---
  useEffect(() => {
    if (!isExamStarted || !sessionId || isFinished) return;

    const sendLockdownAlert = async (type) => {
      try {
        await api.post(`/ExamSession/${sessionId}/lockdown-alert`, {
          alertType: type,
        });
      } catch (err) {
        console.error("Erreur API :", err);
      }
    };

    const handleCopy = (e) => {
      e.preventDefault();
      setAlertMessage(
        "⚠️ ALERTE : La copie des questions est strictement interdite.",
      );
      sendLockdownAlert("Tentative de Copier (Fuite de sujet)");
    };

    const handlePaste = (e) => {
      e.preventDefault();
      setAlertMessage(
        "⚠️ ALERTE : Le collage de texte extérieur est interdit.",
      );
      sendLockdownAlert("Tentative de Coller (Injection IA suspectée)");
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      sendLockdownAlert("Tentative de Clic Droit");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isFinished) {
        setAlertMessage("⚠️ ALERTE : Vous avez quitté le mode plein écran.");
        sendLockdownAlert("Sortie du mode Plein Écran");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAlertMessage("⚠️ ALERTE : Vous avez changé d'onglet.");
        sendLockdownAlert("Changement d'onglet ou perte de focus");
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isExamStarted, sessionId, isFinished]);

  // --- 2. Chronomètre Silencieux ---
  useEffect(() => {
    if (!isExamStarted || !sessionId || isFinished) return;

    const silentAnalysis = async () => {
      const data = getKeystrokeData();
      if (data.length >= 15) {
        try {
          await api.post(`/ExamSession/${sessionId}/analyze`, data);
          clearKeystrokeData();
        } catch (err) {
          console.error("Erreur d'analyse :", err);
        }
      }
    };

    const intervalId = setInterval(silentAnalysis, 5000);
    return () => clearInterval(intervalId);
  }, [
    isExamStarted,
    sessionId,
    isFinished,
    getKeystrokeData,
    clearKeystrokeData,
  ]);

  const startExam = async () => {
    try {
      const response = await api.post("/ExamSession/start");
      setSessionId(response.data.sessionId);
      await document.documentElement.requestFullscreen();
      setIsExamStarted(true);
      setAlertMessage("");
    } catch (err) {
      console.error(err);
      alert("Erreur réseau ou token invalide.");
    }
  };

  // --- 4. Navigation & Modale ---
  const executeQuestionChange = (targetIndex) => {
    setCurrentQuestionIndex(targetIndex);
    setAnswerText("");
    clearKeystrokeData();
    setShowModal(false); // On ferme la modale
  };

  const executeFinish = async () => {
    setIsFinished(true);
    setShowModal(false);
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  const handleQuestionSelect = (targetIndex) => {
    if (targetIndex <= currentQuestionIndex) return;

    if (answerText.trim() === "") {
      // Au lieu du window.confirm, on affiche notre propre modale React
      setPendingTargetIndex(targetIndex);
      setIsFinishingPrompt(false);
      setShowModal(true);
      return;
    }

    executeQuestionChange(targetIndex);
  };

  const finishExam = async () => {
    if (answerText.trim() === "") {
      setIsFinishingPrompt(true);
      setShowModal(true);
      return;
    }
    executeFinish();
  };

  // Fonctions de validation de la modale
  const confirmModalAction = () => {
    if (isFinishingPrompt) {
      executeFinish();
    } else {
      executeQuestionChange(pendingTargetIndex);
    }
  };

  const cancelModalAction = () => {
    setShowModal(false);
    setPendingTargetIndex(null);
  };

  // --- Rendu ---
  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-secureDark text-white">
        <div className="text-center bg-white/5 p-12 rounded-xl border border-green-500/50 shadow-2xl">
          <h1 className="text-4xl font-bold mb-4 text-green-400">
            Examen Terminé ✅
          </h1>
          <p className="text-gray-300 mb-6">
            Vos réponses et votre profil biométrique ont été enregistrés.
          </p>
        </div>
      </div>
    );
  }

  if (!isExamStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white relative">
        <div className="text-center max-w-lg bg-white/5 p-8 rounded-xl border border-gray-700 shadow-2xl">
          <h1 className="text-4xl font-bold mb-4 text-secureAccent">
            Prêt pour l'examen ?
          </h1>
          <button
            onClick={startExam}
            className="w-full py-4 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xl shadow-lg transition-transform transform hover:scale-105"
          >
            Démarrer l'examen sécurisé
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white relative">
      {/* --- LA NOUVELLE MODALE PERSONNALISÉE (Ne casse pas le plein écran !) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl border border-yellow-500 max-w-md text-center shadow-2xl">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">
              ⚠️ Attention
            </h3>
            <p className="text-white mb-8">
              {isFinishingPrompt
                ? "Votre dernière réponse est vide. Voulez-vous vraiment terminer l'examen définitivement ?"
                : "Vous n'avez pas répondu à cette question. Rappel : vous ne pourrez PAS revenir en arrière. Êtes-vous sûr de vouloir l'ignorer et passer à la suite ?"}
            </p>
            <div className="flex justify-between space-x-4">
              <button
                onClick={cancelModalAction}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmModalAction}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold rounded transition-colors"
              >
                Oui, continuer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------------------ */}

      <div className="w-full max-w-4xl bg-white/5 p-8 rounded-xl border border-gray-700 shadow-2xl">
        {alertMessage && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6 font-semibold animate-pulse">
            {alertMessage}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-secureAccent">
            Examen en cours (Session ID: {sessionId})
          </h2>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex border border-gray-600 rounded-lg overflow-hidden shadow-lg">
            {examQuestions.map((_, index) => {
              const isPast = index < currentQuestionIndex;
              const isActive = index === currentQuestionIndex;

              let btnClass =
                "px-6 py-3 text-lg font-bold border-r border-gray-600 last:border-r-0 transition-colors duration-200 ";
              if (isActive) btnClass += "bg-secureAccent text-gray-900";
              else if (isPast)
                btnClass += "bg-gray-800 text-gray-600 cursor-not-allowed";
              else
                btnClass +=
                  "bg-black/50 text-gray-300 hover:bg-gray-700 cursor-pointer";

              return (
                <button
                  key={index}
                  className={btnClass}
                  onClick={() => handleQuestionSelect(index)}
                  disabled={isPast || isActive}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-xl text-gray-200 font-semibold bg-gray-800/50 p-4 rounded border-l-4 border-secureAccent">
            {examQuestions[currentQuestionIndex]}
          </p>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            className="w-full h-48 bg-black/40 border border-gray-600 rounded p-4 text-white focus:outline-none focus:border-secureAccent resize-none text-lg"
            placeholder="Rédigez votre réponse ici..."
          ></textarea>
        </div>

        <div className="flex justify-end border-t border-gray-700 pt-6">
          {currentQuestionIndex < examQuestions.length - 1 ? (
            <button
              onClick={() => handleQuestionSelect(currentQuestionIndex + 1)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow transition-colors"
            >
              Valider et Passer à la suite ➔
            </button>
          ) : (
            <button
              onClick={finishExam}
              className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow transition-colors"
            >
              🛑 Terminer l'examen définitivement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
