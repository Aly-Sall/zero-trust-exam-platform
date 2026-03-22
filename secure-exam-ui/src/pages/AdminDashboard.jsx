import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({ 
    email: "", 
    passwordHash: "", 
    role: "Student",
    cohort: "Cybersecurity-MSc",
    formations: "" // NEW: Holds the comma-separated string before submission
  });

  // 1. Fetch Users
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5162/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Manual Provisioning (Add User)
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    // NEW: Prepare the payload dynamically based on the role
    const payload = {
      ...formData,
      // If Professor, split the string into an array. Otherwise, send an empty array.
      formations: formData.role === "Professor" 
        ? formData.formations.split(",").map(f => f.trim()).filter(f => f !== "") 
        : [],
      // If Student, send the cohort. Otherwise, leave it null/empty.
      cohort: formData.role === "Student" ? formData.cohort : ""
    };

    try {
      const response = await fetch("http://localhost:5162/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("User provisioned successfully! Credentials emailed.");
        // Reset form but keep the default role/cohort
        setFormData({ ...formData, email: "", passwordHash: "", formations: "" }); 
        fetchUsers(); 
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create user.");
      }
    } catch (error) {
      alert("Database connection error.");
    }
  };

  // 3. Edit User (Update)
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    const payload = {
      id: editingUser.id,
      email: editingUser.email,
      role: editingUser.role,
      passwordHash: editingUser.newPassword || "", 
      // Handle the dynamic fields during edit
      cohort: editingUser.role === "Student" ? editingUser.cohort : "",
      formations: editingUser.role === "Professor" 
        ? (typeof editingUser.formations === 'string' 
            ? editingUser.formations.split(",").map(f => f.trim()) 
            : editingUser.formations)
        : []
    };

    try {
      const res = await fetch(`http://localhost:5162/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
        console.log("Update successful!");
      } else {
        const errorData = await res.json();
        alert("Error: " + JSON.stringify(errorData.errors || errorData.message));
      }
    } catch (err) {
      console.error("Connection Error:", err);
    }
  };

  // 4. Delete User
  const deleteUser = async (id) => {
    if (!window.confirm("PERMANENT ACTION: Revoke access for this user?")) return;
    try {
      const response = await fetch(`http://localhost:5162/api/users/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUsers(users.filter((user) => user.id !== id));
      } else {
        alert("Failed to delete user.");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // 5. Bulk CSV Upload
  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return alert("Select a CSV file.");
    
    const uploadData = new FormData();
    uploadData.append("file", csvFile);

    try {
      const response = await fetch("http://localhost:5162/api/users/bulk", {
        method: "POST",
        body: uploadData, 
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Success! Imported ${result.count} users.`);
        setCsvFile(null);
        fetchUsers();
      } else {
        alert("CSV Processing failed.");
      }
    } catch (error) {
      alert("Error uploading file.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-8 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-blue-500">🛡️</span> System Administration
          </h1>
          <p className="text-gray-400 mt-2">Zero-Trust Identity & Access Management</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            {/* CSV Tool */}
            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-lg font-bold mb-4 text-purple-400 border-b border-gray-800 pb-2">Bulk Import (CSV)</h2>
              <form onSubmit={handleCsvUpload} className="space-y-4">
                <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} className="w-full text-sm text-gray-400 file:bg-purple-600 file:text-white file:border-0 file:rounded file:px-4 file:py-2" />
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded font-bold">Upload Roster</button>
              </form>
            </div>

            {/* Manual Tool */}
            <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-lg font-bold mb-4 text-green-400 border-b border-gray-800 pb-2">Manual Provisioning</h2>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <input type="email" placeholder="Email" required className="w-full bg-[#0d1117] border border-gray-700 rounded p-2" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <input type="text" placeholder="Temp Password" required className="w-full bg-[#0d1117] border border-gray-700 rounded p-2" value={formData.passwordHash} onChange={(e) => setFormData({...formData, passwordHash: e.target.value})} />
                
                <div className="flex gap-2">
                  <select className="flex-1 bg-[#0d1117] border border-gray-700 rounded p-2" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    <option value="Student">Student</option>
                    <option value="Professor">Professor</option>
                    <option value="Admin">Admin</option>
                  </select>
                  
                  {/* NEW: Conditional Input Rendering */}
                  {formData.role === "Student" ? (
                    <input type="text" placeholder="Cohort (e.g. Cyber-MSc)" className="flex-1 bg-[#0d1117] border border-gray-700 rounded p-2" value={formData.cohort} onChange={(e) => setFormData({...formData, cohort: e.target.value})} />
                  ) : formData.role === "Professor" ? (
                    <input type="text" placeholder="Formations (IT-BSc, Cyber-MSc)" className="flex-1 bg-[#0d1117] border border-blue-500 rounded p-2" value={formData.formations} onChange={(e) => setFormData({...formData, formations: e.target.value})} />
                  ) : null}
                </div>

                <button type="submit" className="w-full bg-green-600 hover:bg-green-500 py-2 rounded font-bold">Execute Provisioning</button>
              </form>
            </div>
          </div>

          {/* User Table */}
          <div className="lg:col-span-2 bg-[#161b22] border border-gray-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-blue-400 border-b border-gray-800 pb-2">Active Directory</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-sm border-b border-gray-800">
                    <th className="p-3">Email</th>
                    <th className="p-3">Cohort / Formations</th>
                    <th className="p-3">Clearance</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-500 italic">
                        Database is clean. Create your first user!
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-800/40">
                        <td className="p-3 text-sm">{user.email}</td>
                        {/* NEW: Display Formations if Professor, Cohort if Student */}
                        <td className="p-3 text-sm text-gray-400">
                          {user.role === 'Professor' && user.formations?.length > 0 
                            ? <span className="text-blue-400">{user.formations.join(", ")}</span>
                            : user.cohort || "N/A"}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user.role === 'Admin' ? 'border-red-500 text-red-500' : user.role === 'Professor' ? 'border-blue-500 text-blue-500' : 'border-green-500 text-green-500'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-3">
                          <button onClick={() => setEditingUser({...user, formations: user.formations?.join(", ") || ""})} className="text-blue-400 hover:underline text-sm">Edit</button>
                          <button onClick={() => deleteUser(user.id)} className="text-red-400 hover:underline text-sm">Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-[#161b22] border border-gray-700 p-8 rounded-xl max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">👤</span>
              <h2 className="text-xl font-bold text-blue-400">Update User Access</h2>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-5">
              
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Identify (Email)</label>
                <input 
                  className="w-full bg-[#0d1117] border border-gray-800 p-2.5 rounded mt-1 focus:border-blue-500 outline-none transition-all" 
                  value={editingUser.email} 
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
                />
              </div>

              {/* NEW: Conditional Edit Inputs */}
              {editingUser.role === "Student" ? (
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Classification (Cohort)</label>
                  <input 
                    className="w-full bg-[#0d1117] border border-gray-800 p-2.5 rounded mt-1 focus:border-blue-500 outline-none transition-all" 
                    value={editingUser.cohort || ""} 
                    onChange={(e) => setEditingUser({...editingUser, cohort: e.target.value})} 
                  />
                </div>
              ) : editingUser.role === "Professor" ? (
                <div>
                  <label className="text-[10px] text-blue-400 uppercase font-black tracking-widest">Assigned Formations (Comma Separated)</label>
                  <input 
                    className="w-full bg-[#0d1117] border border-blue-900/50 p-2.5 rounded mt-1 focus:border-blue-500 outline-none transition-all" 
                    value={editingUser.formations || ""} 
                    onChange={(e) => setEditingUser({...editingUser, formations: e.target.value})} 
                  />
                </div>
              ) : null}

              {/* PASSWORD OVERWRITE SECTION */}
              <div className="pt-2">
                <label className="text-[10px] text-red-500 uppercase font-black tracking-widest">Credential Reset (Optional)</label>
                <div className="relative mt-1">
                  <input 
                    type="text" 
                    placeholder="Enter new password to overwrite..." 
                    className="w-full bg-[#1c1111] border border-red-900/30 focus:border-red-600 p-2.5 rounded text-sm placeholder-gray-700 outline-none transition-all" 
                    value={editingUser.newPassword || ""} 
                    onChange={(e) => setEditingUser({...editingUser, newPassword: e.target.value})} 
                  />
                  <div className="text-[9px] text-gray-500 mt-1.5 italic">
                    * Leave blank to keep the current encrypted password active.
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 py-2.5 rounded font-bold shadow-lg transition-all active:scale-95">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-2.5 rounded font-bold transition-all">
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}