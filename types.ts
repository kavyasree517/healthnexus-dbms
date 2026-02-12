
export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export enum AppointmentStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface Patient {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  medicalHistory: string;
  bloodGroup: string;
  lastVisit: string;
  historyEntries?: PatientHistoryEntry[];
}

export interface Doctor {
  id: string;
  userId?: string;
  name: string;
  specialization: string;
  email: string;
  licenseNumber: string;
  availability: string[];
  rating: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  reason: string;
}

export interface PatientHistoryEntry {
  id: string;
  date: string;
  diagnosis: string;
  treatment: string;
  prescriptions?: string[];
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medication: string;
  dosage: string;
  duration: string;
  date: string;
}

export interface AIReport {
  id: string;
  patientId: string;
  symptoms_text: string;
  ai_response: AISymptomResult;
  created_at: string;
}

export interface AISymptomResult {
  possibleDiseases: string[];
  severity: 'Low' | 'Medium' | 'High' | 'Emergency';
  specialist: string;
  precautions: string[];
  recommendation: string;
  disclaimer: string;
}
