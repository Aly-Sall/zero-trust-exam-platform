import { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import useKeystrokeDynamics from "../hooks/useKeystrokeDynamics";
import useProctoringVision from "../hooks/useProctoringVision";
import api from "../api/axiosConfig";

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
  const [, setAlertMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [pendingTargetIndex, setPendingTargetIndex] = useState(null);
  const [, setIsFinishingPrompt] = useState(false);

  const webcamRef = useRef(null);
  const { handleKeyDown, handleKeyUp, getKeystrokeData, clearKeystrokeData } =
    useKeystrokeDynamics();

  // --- AI Vision Callback ---
  const handleVisionAnomaly = useCallback(
    async (anomalyType) => {
      if (!sessionId || isFinished) return;
      try {
        // Sends the alert directly to your ExamSessionController.cs
        await api.post(`/ExamSession/${sessionId}/lockdown-alert`, {
          alertType: `VISUAL: ${anomalyType}`,
        });
      } catch (err) {
        console.error("Failed to send visual alert:", err);
      }
    },
    [sessionId, isFinished],
  );

  const { isModelLoading } = useProctoringVision(
    webcamRef,
    handleVisionAnomaly,
  );

  // --- Browser Lockdown ---
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
      setAlertMessage("⚠️ ALERT: Copying is forbidden.");
      sendLockdownAlert("Copy Attempt");
    };
    const handlePaste = (e) => {
      e.preventDefault();
      setAlertMessage("⚠️ ALERT: Pasting is forbidden.");
      sendLockdownAlert("Paste Attempt");
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      sendLockdownAlert("Right-Click Attempt");
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isFinished) {
        setAlertMessage("⚠️ ALERT: You exited full-screen.");
        sendLockdownAlert("Exited Full-Screen");
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isExamStarted, sessionId, isFinished]);

  // --- Biometrics Analysis ---
  useEffect(() => {
    if (!isExamStarted || !sessionId || isFinished) return;
    const intervalId = setInterval(async () => {
      const data = getKeystrokeData();
      if (data.length >= 15) {
        try {
          await api.post(`/ExamSession/${sessionId}/analyze`, data);
          clearKeystrokeData();
        } catch (err) {
          console.error(err);
        }
      }
    }, 5000);
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
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Error starting exam.");
    }
  };

  const handleQuestionSelect = (targetIndex) => {
    if (targetIndex <= currentQuestionIndex) return;
    if (answerText.trim() === "") {
      setPendingTargetIndex(targetIndex);
      setIsFinishingPrompt(false);
      setShowModal(true);
      return;
    }
    setCurrentQuestionIndex(targetIndex);
    setAnswerText("");
    clearKeystrokeData();
  };

  // --- Render ---
  if (isFinished)
    return (
      <div className="min-h-screen flex items-center justify-center bg-secureDark text-white">
        <h1>Exam Completed ✅</h1>
      </div>
    );

  if (!isExamStarted)
    return (
      <div className="min-h-screen flex items-center justify-center bg-secureDark text-white">
        <button
          onClick={startExam}
          className="px-8 py-4 bg-blue-600 rounded-lg font-bold text-xl"
        >
          Start Secure Exam
        </button>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-white bg-secureDark relative">
      <Webcam
        ref={webcamRef}
        audio={false}
        style={{ opacity: 0, position: "absolute" }}
      />

      {isModelLoading && (
        <div className="fixed top-4 right-4 text-gray-500 text-xs">
          ⏳ AI Vision Loading...
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl border border-yellow-500 text-center">
            <h3 className="text-xl font-bold mb-4">⚠️ Warning</h3>
            <p className="mb-8">Cannot go back once you proceed. Continue?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-600 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCurrentQuestionIndex(pendingTargetIndex);
                  setShowModal(false);
                  setAnswerText("");
                }}
                className="px-6 py-2 bg-yellow-600 rounded"
              >
                Yes, proceed
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white/5 p-8 rounded-xl border border-gray-700 shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="flex border border-gray-600 rounded-lg overflow-hidden">
            {examQuestions.map((_, index) => (
              <button
                key={index}
                disabled={index <= currentQuestionIndex}
                onClick={() => handleQuestionSelect(index)}
                className={`px-6 py-3 font-bold border-r border-gray-600 last:border-r-0 ${index === currentQuestionIndex ? "bg-secureAccent text-black" : "text-gray-400"}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xl mb-4 p-4 bg-gray-800 rounded border-l-4 border-secureAccent">
          {examQuestions[currentQuestionIndex]}
        </p>

        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          className="w-full h-48 bg-black/40 border border-gray-600 rounded p-4 text-white resize-none"
          placeholder="Type your answer... (AI Monitoring active)"
        />

        <div className="flex justify-end mt-6">
          <button
            onClick={() => {
              if (currentQuestionIndex < examQuestions.length - 1)
                handleQuestionSelect(currentQuestionIndex + 1);
              else setIsFinished(true);
            }}
            className="px-8 py-3 bg-blue-600 rounded font-bold"
          >
            {currentQuestionIndex < examQuestions.length - 1
              ? "Next ➔"
              : "Finish Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}
