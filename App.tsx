
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Calendar, FileText, Pill, LayoutDashboard, Activity, UserCircle, 
  Clock, Plus, Trash2, Edit2, X, Bell, ChevronLeft, Menu, LogOut, Search,
  Stethoscope, ShieldCheck, Heart, UserPlus, BrainCircuit, AlertCircle,
  History, Sparkles, Send, CheckCircle, PlusCircle, Save, Briefcase
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { 
  UserRole, Appointment, AppointmentStatus, Patient, Doctor, 
  AISymptomResult, User, Prescription, AIReport 
} from './types';
import { NAV_ITEMS, STATUS_STYLES } from './constants';
import { analyzeSymptoms } from './services/geminiService';

// --- INITIAL MOCK DATA ---
const INITIAL_DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr. Sarah Connor', specialization: 'Cardiology', email: 'sarah@nexus.med', licenseNumber: 'MED-10001', availability: ['Mon', 'Wed'], rating: 4.9 },
  { id: 'd2', name: 'Dr. John Watson', specialization: 'Diagnostics', email: 'watson@nexus.med', licenseNumber: 'MED-10002', availability: ['Tue', 'Thu'], rating: 4.8 },
];

const INITIAL_PATIENTS: Patient[] = [
  { id: 'p1', name: 'John Doe', email: 'john@nexus.med', phone: '555-0101', medicalHistory: 'Hypertension', bloodGroup: 'O+', lastVisit: '2024-01-10', historyEntries: [{ id: 'h1', date: '2024-01-10', diagnosis: 'Routine Checkup', treatment: 'Rest' }] },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'a1', patientId: 'p1', doctorId: 'd1', patientName: 'John Doe', doctorName: 'Dr. Sarah Connor', date: '2024-02-24', time: '10:00 AM', status: AppointmentStatus.PENDING, reason: 'Checkup' }
];

// --- COMPONENTS ---

const Login = ({ onLogin }: { onLogin: (role: UserRole, user: User) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = { 
      id: role === 'ADMIN' ? 'u_admin' : role === 'DOCTOR' ? 'd1' : 'p1', 
      email, 
      role, 
      name: role === 'ADMIN' ? 'System Administrator' : role === 'DOCTOR' ? 'Dr. Sarah Connor' : 'John Doe' 
    };
    onLogin(role, user);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-medical p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-12 rounded-[56px] w-full max-w-lg border-white shadow-2xl">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-5 bg-teal-500 text-white rounded-[24px] shadow-xl mb-6"><Activity size={32} /></div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Healthcare Nexus</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Secure Gateway Access</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
            {(['PATIENT', 'DOCTOR', 'ADMIN'] as UserRole[]).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)} className={`py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${role === r ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{r}</button>
            ))}
          </div>
          <div className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-bold" required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all font-bold" required />
          </div>
          <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-teal-600 transition-all active:scale-95">Initiate Login</button>
        </form>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [aiReports, setAiReports] = useState<AIReport[]>([]);
  
  // UI States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [aiResult, setAiResult] = useState<AISymptomResult | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor>>({});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (role: UserRole, user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleAiCheck = async () => {
    if (!symptoms.trim() || !currentUser) return;
    setIsAiLoading(true);
    try {
      const result = await analyzeSymptoms(symptoms);
      setAiResult(result);
      // Simulate saving to ai_reports table
      const newReport: AIReport = {
        id: Math.random().toString(36).substr(2, 9),
        patientId: currentUser.id,
        symptoms_text: symptoms,
        ai_response: result,
        created_at: new Date().toISOString()
      };
      setAiReports(prev => [newReport, ...prev]);
    } catch (error) {
      alert("Analysis failed. Please check your network or API key.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const saveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoctor.id) {
      setDoctors(doctors.map(d => d.id === editingDoctor.id ? (editingDoctor as Doctor) : d));
    } else {
      const newDoc: Doctor = {
        ...editingDoctor as Doctor,
        id: 'd' + (doctors.length + 1),
        rating: 5.0
      };
      setDoctors([...doctors, newDoc]);
    }
    setShowDoctorModal(false);
    setEditingDoctor({});
  };

  const filteredAppointments = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') return appointments;
    if (currentUser.role === 'DOCTOR') return appointments.filter(a => a.doctorId === currentUser.id);
    return appointments.filter(a => a.patientId === currentUser.id);
  }, [currentUser, appointments]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white flex-col gap-8">
        <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="p-8 bg-teal-500 rounded-[32px] shadow-2xl shadow-teal-500/30">
          <Activity size={48} />
        </motion.div>
        <h2 className="text-4xl font-black tracking-tighter">Establishing Nexus...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-medical relative overflow-hidden">
      
      {/* SIDEBAR */}
      <motion.aside animate={{ x: isSidebarOpen ? 0 : -320 }} className="w-80 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-[100] shadow-2xl">
        <div className="p-10 flex flex-col flex-1">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-4 bg-teal-500 rounded-[22px] shadow-xl"><Activity size={24} /></div>
            <h1 className="text-2xl font-black tracking-tighter">Nexus HMS</h1>
          </div>
          <nav className="space-y-3">
            {NAV_ITEMS.filter(item => item.roles.includes(currentUser.role)).map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-5 px-8 py-5 rounded-[28px] transition-all ${activeTab === item.id ? 'bg-teal-500 text-white shadow-2xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                {item.icon}
                <span className="font-bold tracking-tight text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-10 border-t border-white/5">
          <button onClick={() => setCurrentUser(null)} className="flex items-center gap-4 text-slate-500 hover:text-rose-400 transition-all font-black uppercase tracking-widest text-[10px] w-full px-2">
            <LogOut size={18} /> Logout Session
          </button>
        </div>
      </motion.aside>

      {/* MAIN CONTENT */}
      <motion.main animate={{ marginLeft: isSidebarOpen ? 320 : 0 }} className="flex-1 p-16 max-w-[1600px] mx-auto w-full">
        <header className="flex justify-between items-end mb-16">
          <div className="flex items-center gap-8">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-5 bg-slate-900 text-white rounded-3xl shadow-xl hover:bg-teal-500 transition-all"><Menu size={20} /></button>
            )}
            <div>
              <p className="text-teal-600 font-black uppercase tracking-[0.4em] text-[10px] mb-2">Nexus Node Control</p>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter capitalize">{activeTab}</h2>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-black text-slate-900">{currentUser.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role}</p>
            </div>
            <div className="w-16 h-16 rounded-[24px] bg-slate-200 flex items-center justify-center text-slate-500 font-black text-xl">{currentUser.name[0]}</div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="glass p-10 rounded-[48px] border-white shadow-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[24px]"><Users size={24} /></div>
                  </div>
                  <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Clinic Registry</h3>
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">{patients.length}</p>
                </div>
                <div className="glass p-10 rounded-[48px] border-white shadow-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-5 bg-teal-50 text-teal-600 rounded-[24px]"><Calendar size={24} /></div>
                  </div>
                  <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Schedules</h3>
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">{filteredAppointments.length}</p>
                </div>
                {currentUser.role === 'ADMIN' ? (
                  <div className="glass p-10 rounded-[48px] border-white shadow-lg">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-5 bg-rose-50 text-rose-600 rounded-[24px]"><Briefcase size={24} /></div>
                    </div>
                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Doctors</h3>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">{doctors.length}</p>
                  </div>
                ) : (
                  <div className="glass p-10 rounded-[48px] border-white shadow-lg">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-5 bg-rose-50 text-rose-600 rounded-[24px]"><Heart size={24} /></div>
                    </div>
                    <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Care Status</h3>
                    <p className="text-5xl font-black text-slate-900 tracking-tighter">Optimum</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="glass p-12 rounded-[64px] border-white shadow-xl">
                  <h3 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">Recent Activity</h3>
                  <div className="space-y-6">
                    {filteredAppointments.slice(0, 3).map(a => (
                      <div key={a.id} className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-3xl">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-teal-600"><Clock size={20} /></div>
                        <div>
                          <p className="font-black text-slate-900">{a.status} Appointment</p>
                          <p className="text-xs font-bold text-slate-400">{a.date} at {a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass p-12 rounded-[64px] border-white shadow-xl">
                  <h3 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">System Flux</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[{n:'M',c:10},{n:'T',c:25},{n:'W',c:18},{n:'T',c:45},{n:'F',c:30}]}>
                        <defs><linearGradient id="color" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/><stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/></linearGradient></defs>
                        <XAxis dataKey="n" axisLine={false} tickLine={false} />
                        <Area type="monotone" dataKey="c" stroke="#14b8a6" fill="url(#color)" strokeWidth={4} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && currentUser.role === 'ADMIN' && (
            <motion.div key="sys" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Staff Management</h3>
                  <button onClick={() => { setEditingDoctor({}); setShowDoctorModal(true); }} className="px-10 py-5 bg-slate-900 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-teal-600 transition-all">Add New Specialist</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {doctors.map(d => (
                    <div key={d.id} className="glass p-10 rounded-[56px] border-white shadow-lg flex items-center justify-between">
                       <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-[28px] bg-slate-100 flex items-center justify-center text-slate-400"><Stethoscope size={32} /></div>
                          <div>
                             <p className="text-xl font-black text-slate-900">{d.name}</p>
                             <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">{d.specialization}</p>
                             <p className="text-[10px] text-slate-400 mt-1">{d.email}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => { setEditingDoctor(d); setShowDoctorModal(true); }} className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm border border-slate-100 hover:bg-indigo-50 transition-all"><Edit2 size={16} /></button>
                         <button onClick={() => setDoctors(doctors.filter(doc => doc.id !== d.id))} className="p-4 bg-white text-rose-600 rounded-2xl shadow-sm border border-slate-100 hover:bg-rose-50 transition-all"><Trash2 size={16} /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'symptom-checker' && currentUser.role === 'PATIENT' && (
            <motion.div key="ai" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <div className="p-6 bg-gradient-to-br from-indigo-500 to-teal-500 text-white rounded-[32px] w-fit mx-auto shadow-2xl mb-8"><BrainCircuit size={48} /></div>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter">AI Clinical Agent</h3>
                <p className="text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">Submit your clinical data for immediate intelligent analysis.</p>
              </div>

              <div className="glass p-12 rounded-[56px] border-white shadow-2xl space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6">Symptom Input Terminal</label>
                  <textarea 
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                    placeholder="Describe symptoms here..."
                    className="w-full h-48 bg-slate-50/50 rounded-[40px] p-10 border border-slate-100 outline-none focus:ring-8 focus:ring-teal-500/5 focus:border-teal-500 transition-all font-bold text-lg resize-none"
                  />
                </div>
                <button 
                  onClick={handleAiCheck} 
                  disabled={isAiLoading || !symptoms.trim()}
                  className="w-full py-10 bg-slate-900 text-white rounded-[48px] font-black uppercase tracking-[0.4em] text-xs shadow-2xl hover:bg-teal-600 transition-all flex items-center justify-center gap-6 disabled:opacity-20"
                >
                  {isAiLoading ? <Activity className="animate-spin" /> : <Sparkles size={24} />}
                  {isAiLoading ? 'Synthesizing Patterns...' : 'Commence Analysis'}
                </button>
              </div>

              {aiResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
                  <div className="p-10 bg-amber-50 border border-amber-100 rounded-[40px] flex items-start gap-6 shadow-sm">
                    <AlertCircle className="text-amber-600 mt-1" size={24} />
                    <p className="text-amber-800 font-bold text-sm leading-relaxed">{aiResult.disclaimer}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="glass p-12 rounded-[56px] border-white shadow-xl space-y-8">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><History size={16} /> Findings</h4>
                      <div className="space-y-3">
                        {aiResult.possibleDiseases.map((d, i) => (
                          <div key={i} className="px-6 py-4 bg-slate-50 rounded-2xl font-black text-slate-800 border border-slate-100">{d}</div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                        <span className="text-[10px] font-black uppercase text-slate-400">Threat Level</span>
                        <span className={`px-6 py-2 rounded-full font-black text-xs ${aiResult.severity === 'Emergency' ? 'bg-rose-500 text-white' : 'bg-teal-100 text-teal-700'}`}>{aiResult.severity}</span>
                      </div>
                    </div>
                    <div className="glass p-12 rounded-[56px] border-white shadow-xl space-y-8">
                       <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Stethoscope size={16} /> Expert Routing</h4>
                       <div className="p-8 bg-indigo-50 text-indigo-700 rounded-3xl font-black text-2xl tracking-tight">{aiResult.specialist}</div>
                       <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Immediate Care</h4>
                        <ul className="space-y-3">
                          {aiResult.precautions.map((p, i) => (
                            <li key={i} className="flex items-center gap-3 text-slate-600 font-bold text-sm"><CheckCircle className="text-teal-500" size={16} /> {p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {aiReports.length > 0 && (
                 <div className="space-y-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Historical Data</h3>
                    <div className="space-y-4">
                      {aiReports.map(report => (
                        <div key={report.id} className="glass p-8 rounded-[40px] border-white shadow-md flex justify-between items-center">
                          <div>
                            <p className="font-black text-slate-900 line-clamp-1 max-w-md">{report.symptoms_text}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{new Date(report.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className="px-4 py-2 bg-slate-100 rounded-full font-black text-[10px] uppercase text-slate-600">{report.ai_response.severity}</span>
                        </div>
                      ))}
                    </div>
                 </div>
              )}
            </motion.div>
          )}

          {activeTab === 'appointments' && (
            <motion.div key="apts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Active Pipeline</h3>
                  {currentUser.role !== 'DOCTOR' && (
                    <button className="px-10 py-5 bg-slate-900 text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-teal-600 transition-all">Schedule Session</button>
                  )}
               </div>
               <div className="grid grid-cols-1 gap-6">
                  {filteredAppointments.length === 0 ? (
                    <div className="glass p-20 rounded-[56px] border-white text-center">
                       <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">No Pipeline Entities Active</p>
                    </div>
                  ) : (
                    filteredAppointments.map(apt => (
                      <div key={apt.id} className="glass p-10 rounded-[56px] border-white shadow-lg flex items-center justify-between">
                        <div className="flex items-center gap-8">
                           <div className="w-20 h-20 rounded-[28px] bg-slate-950 text-white flex flex-col items-center justify-center">
                              <span className="text-[10px] opacity-60">FEB</span>
                              <span className="text-2xl font-black">24</span>
                           </div>
                           <div>
                              <p className="text-xl font-black text-slate-900 tracking-tight">{currentUser.role === 'DOCTOR' ? apt.patientName : apt.doctorName}</p>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {apt.status}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           {currentUser.role === 'DOCTOR' && (
                             <button className="px-6 py-3 bg-teal-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Prescribe</button>
                           )}
                           <span className={`px-6 py-2 rounded-full font-black text-[10px] uppercase ${STATUS_STYLES[apt.status]}`}>{apt.status}</span>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </motion.div>
          )}

          {activeTab === 'records' && (
            <motion.div key="rec" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Records</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {patients.map(p => (
                    <div key={p.id} className="glass p-10 rounded-[56px] border-white shadow-lg space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-black">{p.name[0]}</div>
                          <div>
                             <p className="font-black text-slate-900">{p.name}</p>
                             <p className="text-xs text-slate-400">{p.bloodGroup} Primary</p>
                          </div>
                       </div>
                       <div className="space-y-4">
                          {p.historyEntries?.map(h => (
                            <div key={h.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                               <p className="text-[10px] font-black uppercase text-teal-600 mb-1">{h.date}</p>
                               <p className="font-bold text-slate-900">{h.diagnosis}</p>
                               <p className="text-xs text-slate-500 mt-2">{h.treatment}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {/* ADMIN MODAL */}
      <AnimatePresence>
        {showDoctorModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass p-12 rounded-[56px] w-full max-w-2xl border-white shadow-2xl relative">
              <button onClick={() => setShowDoctorModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-600"><X size={24} /></button>
              <h3 className="text-3xl font-black text-slate-900 mb-10">{editingDoctor.id ? 'Modify Entity' : 'New Specialist Entity'}</h3>
              <form onSubmit={saveDoctor} className="grid grid-cols-2 gap-6">
                <input placeholder="Name" value={editingDoctor.name || ''} onChange={e => setEditingDoctor({...editingDoctor, name: e.target.value})} className="col-span-2 px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-teal-500/10 font-bold" required />
                <input placeholder="Email" value={editingDoctor.email || ''} onChange={e => setEditingDoctor({...editingDoctor, email: e.target.value})} className="px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-teal-500/10 font-bold" required />
                <input placeholder="Specialization" value={editingDoctor.specialization || ''} onChange={e => setEditingDoctor({...editingDoctor, specialization: e.target.value})} className="px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-teal-500/10 font-bold" required />
                <input placeholder="License Number" value={editingDoctor.licenseNumber || ''} onChange={e => setEditingDoctor({...editingDoctor, licenseNumber: e.target.value})} className="col-span-2 px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-teal-500/10 font-bold" required />
                <button type="submit" className="col-span-2 py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-4">
                  <Save size={20} /> Commit Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
