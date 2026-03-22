import { useState, useEffect } from "react";

export default function QuestionBankBuilder({ onSave, onCancel, initialData }) {
  const [folderName, setFolderName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [questions, setQuestions] = useState([]);

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null); // track inline edits

  // ✅ THE FIX: sync state whenever initialData arrives (async edit flow)
  useEffect(() => {
    if (initialData) {
      setFolderName(initialData.folderName || "");
      setCourseName(initialData.course || "");
      setQuestions(initialData.questions || []);
    } else {
      // Reset to blank when switching to Create mode
      setFolderName("");
      setCourseName("");
      setQuestions([]);
    }
    // Reset the question form too
    setCurrentQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectOptionIndex(0);
    setEditingIndex(null);
  }, [initialData]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOrUpdateQuestion = (e) => {
    e.preventDefault();
    if (!currentQuestion.trim() || options.some((opt) => !opt.trim())) {
      alert("Please fill out the question text and all 4 options.");
      return;
    }

    const newQuestion = {
      text: currentQuestion,
      options: [...options],
      correctAnswerIndex: correctOptionIndex,
    };

    if (editingIndex !== null) {
      // ✅ Update existing question in-place
      const updated = [...questions];
      updated[editingIndex] = newQuestion;
      setQuestions(updated);
      setEditingIndex(null);
    } else {
      setQuestions([...questions, newQuestion]);
    }

    setCurrentQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectOptionIndex(0);
  };

  const handleEditQuestion = (idx) => {
    const q = questions[idx];
    setCurrentQuestion(q.text);
    setOptions([...q.options]);
    setCorrectOptionIndex(q.correctAnswerIndex);
    setEditingIndex(idx);
  };

  const handleCancelEdit = () => {
    setCurrentQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectOptionIndex(0);
    setEditingIndex(null);
  };

  const removeQuestion = (indexToRemove) => {
    setQuestions(questions.filter((_, idx) => idx !== indexToRemove));
    if (editingIndex === indexToRemove) handleCancelEdit();
  };

  const handleSubmitFolder = () => {
    if (questions.length === 0) return alert("You must add at least one question.");
    if (!folderName.trim() || !courseName.trim())
      return alert("Provide a Course and Folder Name.");

    onSave({ id: initialData?.id, folderName, course: courseName, questions });
  };

  const isEditing = editingIndex !== null;

  return (
    <div className="text-white space-y-6">
      {/* Step 1: Folder Details */}
      <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
        <h3 className="text-lg font-bold text-blue-400 mb-4">📂 Step 1: Folder Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Course Name"
            className="bg-[#161b22] border border-gray-600 rounded p-3 focus:border-blue-500 outline-none"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Folder Name"
            className="bg-[#161b22] border border-gray-600 rounded p-3 focus:border-blue-500 outline-none"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </div>
      </div>

      {/* Step 2: Write / Edit a Question */}
      <div className={`bg-gray-800/50 p-5 rounded-lg border transition-colors ${isEditing ? "border-yellow-500/60" : "border-gray-700"}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-bold ${isEditing ? "text-yellow-400" : "text-green-400"}`}>
            {isEditing ? `✏️ Editing Question ${editingIndex + 1}` : "✍️ Step 2: Write Questions"}
          </h3>
          {isEditing && (
            <button
              onClick={handleCancelEdit}
              className="text-xs text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded transition-colors"
            >
              ✖ Cancel Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          <textarea
            placeholder="Type the question here..."
            className={`w-full bg-[#161b22] border rounded p-3 outline-none h-24 resize-none focus:border-green-500 transition-colors ${isEditing ? "border-yellow-500/50" : "border-gray-600"}`}
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-[#161b22] p-2 rounded border border-gray-700 focus-within:border-green-500 transition-colors"
              >
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctOptionIndex === idx}
                  onChange={() => setCorrectOptionIndex(idx)}
                  className="w-5 h-5 accent-green-500 cursor-pointer"
                />
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  className="bg-transparent w-full outline-none"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleAddOrUpdateQuestion}
            className={`w-full py-3 rounded font-bold text-white transition-colors border ${
              isEditing
                ? "bg-yellow-600 hover:bg-yellow-500 border-yellow-500"
                : "bg-gray-700 hover:bg-gray-600 border-gray-500"
            }`}
          >
            {isEditing ? "✅ Update Question" : "➕ Add Question to Folder"}
          </button>
        </div>
      </div>

      {/* Step 3: Folder Summary */}
      <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-purple-400">
            📦 Folder Summary ({questions.length} Questions)
          </h3>
        </div>

        <div className="max-h-48 overflow-y-auto mb-6 space-y-2 pr-2">
          {questions.length === 0 && (
            <p className="text-gray-500 italic text-sm text-center py-4">
              No questions yet. Add one above.
            </p>
          )}
          {questions.map((q, idx) => (
            <div
              key={idx}
              className={`bg-[#161b22] p-3 rounded border flex justify-between items-center transition-colors ${
                editingIndex === idx ? "border-yellow-500/60 bg-yellow-900/10" : "border-gray-600"
              }`}
            >
              <span className="truncate pr-4 text-sm">
                <strong className="text-blue-400">Q{idx + 1}:</strong> {q.text}
              </span>
              <div className="flex gap-3 shrink-0">
                {/* ✅ NEW: edit individual question inline */}
                <button
                  onClick={() => handleEditQuestion(idx)}
                  className="text-yellow-400 hover:text-yellow-300 text-xs font-bold"
                  title="Edit this question"
                >
                  ✏️
                </button>
                <button
                  onClick={() => removeQuestion(idx)}
                  className="text-red-400 hover:text-red-300 font-bold text-xs"
                  title="Delete question"
                >
                  ✖
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 border-t border-gray-700 pt-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded font-bold text-red-400 hover:bg-red-900/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitFolder}
            className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold shadow-lg transition-colors"
          >
            💾 {initialData ? "Update Bank" : "Save to Database"}
          </button>
        </div>
      </div>
    </div>
  );
}
