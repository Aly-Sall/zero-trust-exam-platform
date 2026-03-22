import { useState } from "react";

// NEW: Added professorProfile to the incoming props
export default function ScheduleExamModal({ availableBanks, professorProfile, onSchedule, onCancel }) {
  const [examTitle, setExamTitle] = useState("");
  const [targetFormation, setTargetFormation] = useState("");
  const [examDate, setExamDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [questionCount, setQuestionCount] = useState(20);

  const selectedBank = availableBanks.find(bank => bank.id.toString() === selectedBankId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedBank) {
      alert("Please select a Question Bank folder.");
      return;
    }
    if (questionCount > selectedBank.totalQuestions) {
      alert(`You cannot select more than ${selectedBank.totalQuestions} questions.`);
      return;
    }

    // UPDATED: These keys now exactly match your C# ScheduleExamPayload!
    onSchedule({
      title: examTitle,
      courseName: selectedBank.course, // Auto-grabs the course name from the bank!
      cohort: targetFormation,         // C# expects "Cohort"
      startTime: examDate,             // C# expects "StartTime"
      durationMinutes: duration,
      sourceBankId: selectedBank.id,
      questionsToPull: questionCount,
      professorEmail: professorProfile?.email || "professor@university.edu" // Attaches the prof's email for the notification
    });
  };

  return (
    <div className="text-white space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold text-blue-400 mb-4">📅 1. Exam Logistics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Title Input */}
            <input 
              type="text" 
              placeholder="Exam Title" 
              required 
              className="bg-[#161b22] border border-gray-600 rounded p-2 focus:border-blue-500 outline-none" 
              value={examTitle} 
              onChange={(e) => setExamTitle(e.target.value)} 
            />

            {/* 🟢 NEW: The Formations Dropdown instead of Text Input */}
            <select 
              required 
              className={`bg-[#161b22] border rounded p-2 outline-none ${targetFormation ? 'text-white border-blue-500' : 'text-gray-400 border-gray-600'}`}
              value={targetFormation} 
              onChange={(e) => setTargetFormation(e.target.value)}
            >
              <option value="" disabled>Select Target Formation...</option>
              {professorProfile?.formations?.map((formation, idx) => (
                <option key={idx} value={formation} className="text-white">
                  {formation}
                </option>
              ))}
            </select>

            {/* Date Input */}
            <input 
              type="datetime-local" 
              required 
              className="bg-[#161b22] border border-gray-600 rounded p-2 focus:border-blue-500 outline-none text-gray-300" 
              value={examDate} 
              onChange={(e) => setExamDate(e.target.value)} 
            />

            {/* Duration Input */}
            <div className="flex items-center gap-2 bg-[#161b22] border border-gray-600 rounded p-2 focus-within:border-blue-500">
              <input 
                type="number" 
                min="1" 
                required 
                placeholder="Duration" 
                className="bg-transparent outline-none w-full" 
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))} 
              />
              <span className="text-gray-400 text-sm pr-2">Minutes</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold text-green-400 mb-4">⚙️ 2. Dynamic Generation Engine</h3>
          <div className="space-y-4">
            
            {/* Question Bank Dropdown */}
            <select 
              required 
              className="w-full bg-[#161b22] border border-gray-600 rounded p-3 focus:border-green-500 outline-none text-white appearance-none" 
              value={selectedBankId} 
              onChange={(e) => setSelectedBankId(e.target.value)}
            >
              <option value="" disabled>-- Choose a Folder --</option>
              {availableBanks.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.course} - {bank.folderName} ({bank.totalQuestions} questions)
                </option>
              ))}
            </select>

            {/* Questions to Pull */}
            {selectedBankId && (
              <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold text-blue-400">Randomization Settings</p>
                  <p className="text-sm text-gray-400">Questions per student?</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    max={selectedBank?.totalQuestions || 1} 
                    required 
                    className="bg-[#161b22] border border-blue-600 rounded p-2 w-20 text-center font-bold text-white outline-none" 
                    value={questionCount} 
                    onChange={(e) => setQuestionCount(Number(e.target.value))} 
                  />
                  <span className="text-gray-400">/ {selectedBank?.totalQuestions} Max</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold shadow-lg transition-colors">
            🚀 Schedule & Generate
          </button>
          <button type="button" onClick={onCancel} className="flex-1 bg-red-900/50 hover:bg-red-900/80 text-red-400 border border-red-700 py-3 rounded font-bold transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}