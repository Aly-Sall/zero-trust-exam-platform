import { useState, useEffect } from "react";
import useKeystrokeDynamics from "../hooks/useKeystrokeDynamics";
import api from "../api/axiosConfig";

// Our 5 exam questions focused on Cybersecurity / Data Science
const examQuestions = [
  "Question 1: Explain the concept of Zero-Trust Architecture.",
  "Question 2: What are the differences between symmetric and asymmetric encryption?",
  "Question 3: Describe how a SQL injection attack works and how to prevent it.",
  "Question 4: What is the role of a SIEM in a Security Operations Center (SOC)?",
  "Question 5: Explain the principle of behavioral biometrics in authentication.",
];

export default function ExamRoom() {
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);

  // Question and text management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");

  // Custom Modal States (Replaces window.confirm)
  const [showModal, setShowModal] = useState(false);
  const [pendingTargetIndex, setPendingTargetIndex] = useState(null);
  const [isFinishingPrompt, setIsFinishingPrompt] = useState(false);

  const { handleKeyDown, handleKeyUp, getKeystrokeData, clearKeystrokeData } =
    useKeystrokeDynamics();

  // --- 1. Browser Lockdown Management (Anti-Cheat) ---
  useEffect(() => {
    if (!isExamStarted || !sessionId || isFinished) return;

    const sendLockdownAlert = async (type) => {
      try {
        await api.post(`/ExamSession/${sessionId}/lockdown-alert`, {
          alertType: type,
        });
      } catch (err) {
        console.error("API Error:", err);
      }
    };

    const handleCopy = (e) => {
      e.preventDefault();
      setAlertMessage("⚠️ ALERT: Copying questions is strictly forbidden.");
      sendLockdownAlert("Copy Attempt (Subject Leak)");
    };

    const handlePaste = (e) => {
      e.preventDefault();
      setAlertMessage("⚠️ ALERT: Pasting external text is forbidden.");
      sendLockdownAlert("Paste Attempt (Suspected AI Injection)");
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      sendLockdownAlert("Right-Click Attempt");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isFinished) {
        setAlertMessage("⚠️ ALERT: You have exited full-screen mode.");
        sendLockdownAlert("Exited Full-Screen Mode");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAlertMessage("⚠️ ALERT: You have switched tabs or lost focus.");
        sendLockdownAlert("Tab Switch or Focus Lost");
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

  // --- 2. Silent Timer (Data Science Biometrics) ---
  useEffect(() => {
    if (!isExamStarted || !sessionId || isFinished) return;

    const silentAnalysis = async () => {
      const data = getKeystrokeData();
      if (data.length >= 15) {
        try {
          await api.post(`/ExamSession/${sessionId}/analyze`, data);
          clearKeystrokeData();
        } catch (err) {
          console.error("Analysis Error:", err);
        }
      }
    };

    // Run silent analysis every 5 seconds
    const intervalId = setInterval(silentAnalysis, 5000);
    return () => clearInterval(intervalId);
  }, [
    isExamStarted,
    sessionId,
    isFinished,
    getKeystrokeData,
    clearKeystrokeData,
  ]);

  // --- 3. Start Exam ---
  const startExam = async () => {
    try {
      const response = await api.post("/ExamSession/start");
      setSessionId(response.data.sessionId);
      await document.documentElement.requestFullscreen();
      setIsExamStarted(true);
      setAlertMessage("");
    } catch (err) {
      console.error(err);
      alert("Network error or invalid token.");
    }
  };

  // --- 4. Dynamic & One-Way Navigation ---
  const executeQuestionChange = (targetIndex) => {
    setCurrentQuestionIndex(targetIndex);
    setAnswerText("");
    clearKeystrokeData();
    setShowModal(false); // Close the modal
  };

  const executeFinish = async () => {
    setIsFinished(true);
    setShowModal(false);
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  const handleQuestionSelect = (targetIndex) => {
    // Security 1: Strict prohibition on going backwards
    if (targetIndex <= currentQuestionIndex) return;

    // Security 2: Anti-forget warning
    if (answerText.trim() === "") {
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

  // Modal validation functions
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

  // --- UI Render: Exam Finished ---
  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-secureDark text-white">
        <div className="text-center bg-white/5 p-12 rounded-xl border border-green-500/50 shadow-2xl">
          <h1 className="text-4xl font-bold mb-4 text-green-400">
            Exam Completed ✅
          </h1>
          <p className="text-gray-300 mb-6">
            Your answers and biometric profile have been successfully recorded.
          </p>
          <p className="text-gray-500 text-sm">You may now close this tab.</p>
        </div>
      </div>
    );
  }

  // --- UI Render: Exam Landing Page ---
  if (!isExamStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white relative">
        <div className="text-center max-w-lg bg-white/5 p-8 rounded-xl border border-gray-700 shadow-2xl">
          <h1 className="text-4xl font-bold mb-4 text-secureAccent">
            Ready for the exam?
          </h1>
          <p className="text-gray-400 mb-8">
            The exam consists of {examQuestions.length} questions. Warning:
            navigation is one-way (you cannot go back to previous questions).
          </p>
          <button
            onClick={startExam}
            className="w-full py-4 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xl shadow-lg transition-transform transform hover:scale-105"
          >
            Start Secure Exam
          </button>
        </div>
      </div>
    );
  }

  // --- UI Render: Exam In Progress ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white relative">
      {/* --- CUSTOM MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl border border-yellow-500 max-w-md text-center shadow-2xl">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">
              ⚠️ Warning
            </h3>
            <p className="text-white mb-8">
              {isFinishingPrompt
                ? "Your last answer is empty. Are you sure you want to finish the exam permanently?"
                : "You haven't answered this question. Reminder: you CANNOT go back. Are you sure you want to skip it and proceed?"}
            </p>
            <div className="flex justify-between space-x-4">
              <button
                onClick={cancelModalAction}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModalAction}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold rounded transition-colors"
              >
                Yes, continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white/5 p-8 rounded-xl border border-gray-700 shadow-2xl">
        {alertMessage && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6 font-semibold animate-pulse">
            {alertMessage}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-secureAccent">
            Exam in progress (Session ID: {sessionId})
          </h2>
        </div>

        {/* --- DYNAMIC PROGRESS STEPPER --- */}
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
                  title={
                    isPast ? "Cannot go back" : `Go to question ${index + 1}`
                  }
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
            placeholder="Type your answer here. (Behavioral analysis running in the background...)"
          ></textarea>
        </div>

        <div className="flex justify-end border-t border-gray-700 pt-6">
          {currentQuestionIndex < examQuestions.length - 1 ? (
            <button
              onClick={() => handleQuestionSelect(currentQuestionIndex + 1)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow transition-colors"
            >
              Submit and Next ➔
            </button>
          ) : (
            <button
              onClick={finishExam}
              className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow transition-colors"
            >
              🛑 Finish Exam
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
