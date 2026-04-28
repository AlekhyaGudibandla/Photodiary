import { useState, useEffect } from "react";
import { apiRequest } from "../utils/api";
import { Settings as SettingsIcon, User, Lock, Save, LogOut } from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiRequest("/profile");
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage("New passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      await apiRequest("/profile/password", "PUT", {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      setMessage("Password updated successfully!");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setMessage(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="flex-1 p-10 min-h-screen relative z-10">
      <Header />
      
      <main className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-heading font-black text-white mb-2 tracking-tighter flex items-center gap-3">
            <SettingsIcon className="text-primary" size={32} />
            Settings
          </h2>
          <p className="text-gray-500 font-medium text-lg">Manage your account preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-4">
            {/* Sidebar navigation for settings could go here */}
            <div className="glass-card p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <User size={48} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white truncate w-full">{profile?.email || "Loading..."}</h3>
              <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mt-1">Member since {profile ? new Date(profile.createdAt).getFullYear() : ""}</p>
              
              <div className="mt-8 w-full border-t border-white/5 pt-6 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total Entries</span>
                  <span className="text-white font-bold">{profile?.totalEntries || 0}</span>
                </div>
              </div>
            </div>

            <button 
                onClick={logout}
                className="w-full glass-card p-4 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all font-bold"
            >
                <LogOut size={18} /> Sign Out
            </button>
          </div>

          <div className="md:col-span-8 space-y-8">
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                <Lock size={20} className="text-secondary" /> Change Password
              </h3>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                    value={passwords.current}
                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      value={passwords.new}
                      onChange={e => setPasswords({...passwords, new: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      value={passwords.confirm}
                      onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {message && (
                  <p className={`text-sm font-bold ${message.includes("success") ? "text-green-400" : "text-red-400"}`}>
                    {message}
                  </p>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !passwords.current || !passwords.new}
                    className="px-8 py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
