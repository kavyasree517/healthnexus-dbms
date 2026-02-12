
import React from 'react';
import { 
  Users, 
  Calendar, 
  FileText, 
  Pill, 
  LayoutDashboard, 
  Cpu,
  UserCheck,
  Stethoscope,
  Activity,
  ClipboardList
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
  { id: 'appointments', label: 'Appointments', icon: <Calendar size={20} />, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
  { id: 'patients', label: 'Patients', icon: <Users size={20} />, roles: ['ADMIN', 'DOCTOR'] },
  { id: 'records', label: 'Medical Records', icon: <FileText size={20} />, roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
  { id: 'pharmacy', label: 'Pharmacy', icon: <Pill size={20} />, roles: ['ADMIN'] },
  { id: 'symptom-checker', label: 'AI Agent', icon: <Activity size={20} />, roles: ['PATIENT'] },
  { id: 'system', label: 'System', icon: <Cpu size={20} />, roles: ['ADMIN'] },
];

export const STATUS_STYLES = {
  Pending: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};
