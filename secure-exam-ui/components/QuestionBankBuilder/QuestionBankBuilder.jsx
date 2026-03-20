import { useState } from "react";

export default function QuestionBankBuilder({ onSave, onCancel, initialData }) {
  // If initialData is passed, pre-fill the form (Edit Mode). Otherwise, leave blank (Create Mode).
  const [folderName, setFolderName] = useState(initialData?.folderName || "");
  const [courseName, setCourseName] = useState(initialData?.course || "");
  const [questions, setQuestions] = useState(initialData?.questions || []);
  
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!currentQuestion.trim() || options.some(opt => !opt.trim())) {
      alert("Please fill out the question text and all 4 options.");
      return;
    }

    const newQuestion = {
      text: currentQuestion,
      options: [...options],
      correctAnswerIndex: correctOptionIndex
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectOptionIndex(0);
  };

  const removeQuestion = (indexToRemove) => {
    setQuestions(questions.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitFolder = () => {
    if (questions.length === 0) return alert("You must add at least one question.");
    if (!folderName.trim() || !courseName.trim()) return alert("Provide a Course and Folder Name.");

    // Pass the ID back up if we are editing
    onSave({ id: initialData?.id, folderName, course: courseName, questions });
  };

  return (
    <div className="text-white space-y-6">
      <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
        <h3 className="text-lg font-bold text-blue-400 mb-4">📂 Step 1: Folder Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Course Name" required className="bg-[#161b22] border border-gray-600 rounded p-3 focus:border-blue-500 outline-none" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
          <input type="text" placeholder="Folder Name" required className="bg-[#161b22] border border-gray-600 rounded p-3 focus:border-blue-500 outline-none" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
        </div>
      </div>

      <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
        <h3 className="text-lg font-bold text-green-400 mb-4">✍️ Step 2: Write Questions</h3>
        <div className="space-y-4">
          <textarea placeholder="Type the question here..." className="w-full bg-[#161b22] border border-gray-600 rounded p-3 focus:border-green-500 outline-none h-24 resize-none" value={currentQuestion} onChange={(e) => setCurrentQuestion(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-[#161b22] p-2 rounded border border-gray-700 focus-within:border-green-500 transition-colors">
                <input type="radio" name="correctAnswer" checked={correctOptionIndex === idx} onChange={() => setCorrectOptionIndex(idx)} className="w-5 h-5 accent-green-500 cursor-pointer" />
                <input type="text" placeholder={`Option ${idx + 1}`} className="bg-transparent w-full outline-none" value={opt} onChange={(e) => handleOptionChange(idx, e.target.value)} />
              </div>
            ))}
          </div>
          <button onClick={handleAddQuestion} className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-500 py-3 rounded font-bold text-white transition-colors">➕ Add Question to Folder</button>
        </div>
      </div>

      <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-purple-400">📦 Folder Summary ({questions.length} Questions)</h3>
        </div>
        
        {/* NEW: See and Delete existing questions while editing! */}
        <div className="max-h-40 overflow-y-auto mb-6 space-y-2 pr-2">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-[#161b22] p-3 rounded border border-gray-600 flex justify-between items-center">
              <span className="truncate pr-4"><strong className="text-blue-400">Q{idx+1}:</strong> {q.text}</span>
              <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-300 font-bold" title="Delete Question">✖</button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-4 border-t border-gray-700 pt-4">
          <button onClick={onCancel} className="px-6 py-2 rounded font-bold text-red-400 hover:bg-red-900/20 transition-colors">Cancel</button>
          <button onClick={handleSubmitFolder} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold shadow-lg transition-colors">💾 {initialData ? "Update Bank" : "Save to Database"}</button>
        </div>
      </div>
    </div>
  );
}