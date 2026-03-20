import { useState, useEffect } from "react";
import QuestionBankBuilder from "../QuestionBankBuilder/QuestionBankBuilder"; // Check Path!

export default function ExamRepository() {
  const [folders, setFolders] = useState([]); // Mock data is GONE!
  const [isCreating, setIsCreating] = useState(false);
  const [editingBank, setEditingBank] = useState(null); // Stores data when editing

  // 1. Automatically fetch real data from C# when the component loads
  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch("http://localhost:5162/api/exams/banks");
      if (res.ok) setFolders(await res.json());
    } catch (e) {
      console.error("Failed to fetch banks", e);
    }
  };

  // 2. Save works for BOTH Create (POST) and Edit (PUT)
  const handleSaveFolder = async (folderPayload) => {
    const isEditing = !!folderPayload.id;
    const url = isEditing 
        ? `http://localhost:5162/api/exams/banks/${folderPayload.id}` 
        : "http://localhost:5162/api/exams/banks";
    
    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(folderPayload),
      });

      if (response.ok) {
        setIsCreating(false);
        setEditingBank(null);
        fetchBanks(); // Refresh the table automatically!
        alert(isEditing ? "Bank updated successfully!" : "Bank securely saved!");
      }
    } catch (error) {
      alert("Could not connect to the backend server.");
    }
  };

  // 3. The magic EDIT button logic
  const handleEditClick = async (id) => {
    try {
      // Ask C# for the specific folder and ALL its questions
      const res = await fetch(`http://localhost:5162/api/exams/banks/${id}`);
      if (res.ok) {
        const fullBankData = await res.json();
        setEditingBank(fullBankData); // Pre-load the data
        setIsCreating(true); // Open the builder form
      }
    } catch (error) {
      alert("Error fetching folder details.");
    }
  };

  // 4. The real DELETE logic
  const handleDeleteClick = async (id) => {
    if (window.confirm("Delete this folder permanently?")) {
      try {
        await fetch(`http://localhost:5162/api/exams/banks/${id}`, { method: "DELETE" });
        fetchBanks(); // Refresh table
      } catch (e) {
        console.error("Delete failed", e);
      }
    }
  };

  const closeBuilder = () => {
    setIsCreating(false);
    setEditingBank(null);
  };

  return (
    <div className="bg-[#161b22] border border-gray-700 rounded-xl p-8 shadow-2xl min-h-[500px] text-white">
      {isCreating ? (
        <div>
          <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
            <h2 className="text-2xl font-bold text-white">
              {editingBank ? "✏️ Edit Question Folder" : "⚙️ Create New Folder"}
            </h2>
            <button onClick={closeBuilder} className="text-gray-400 hover:text-white transition-colors font-bold">✖ Close</button>
          </div>
          {/* We pass initialData to the builder if we clicked edit! */}
          <QuestionBankBuilder onSave={handleSaveFolder} onCancel={closeBuilder} initialData={editingBank} />
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            <div>
              <h2 className="text-3xl font-bold text-white">📚 Exam Repository</h2>
              <p className="text-gray-400 mt-1">Manage your question folders and secure banks.</p>
            </div>
            <button onClick={() => setIsCreating(true)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2">
              ➕ Create New Folder
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-700 bg-[#0d1117]">
            <table className="w-full text-left">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="p-4 font-semibold text-gray-300">Course</th>
                  <th className="p-4 font-semibold text-gray-300">Folder Name</th>
                  <th className="p-4 font-semibold text-gray-300">Total Questions</th>
                  <th className="p-4 font-semibold text-gray-300">Last Updated</th>
                  <th className="p-4 font-semibold text-right text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {folders.map((folder) => (
                  <tr key={folder.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-bold text-blue-400">{folder.course}</td>
                    <td className="p-4 font-medium">{folder.folderName}</td>
                    <td className="p-4 font-mono text-green-400">{folder.totalQuestions}</td>
                    <td className="p-4 text-sm text-gray-400">{folder.lastUpdated}</td>
                    <td className="p-4 text-right space-x-4">
                      {/* WIRED THE BUTTONS UP! */}
                      <button onClick={() => handleEditClick(folder.id)} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Edit</button>
                      <button onClick={() => handleDeleteClick(folder.id)} className="text-red-500 hover:text-red-400 font-medium transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
                {folders.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500 italic">No folders found in the database. Create one above!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}