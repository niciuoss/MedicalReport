import axios from 'axios';
import { getToken, removeToken } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// Injeta o token JWT em todas as requisições
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redireciona para login em caso de 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  birthDate: string;
  address: string;
  createdAt: string;
}

export interface Medication {
  name: string;
  quantity: string;
  duration: string;
}

export interface MedicalReport {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  doctorCrm: string;
  reportType: string;
  consultationDate: string;
  cid10Codes: string[];
  diagnosis: string;
  clinicalPicture: string;
  treatment: string;
  medications: Medication[];
  conclusion: string;
  createdAt: string;
}

export interface AppUser {
  id: number;
  username: string;
  role: string;
  fullName: string;
  crm: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  fullName: string;
  crm: string | null;
}

// ── Auth ───────────────────────────────────────────────────────────────────

export const login = (username: string, password: string) =>
  api.post<LoginResponse>('/api/auth/login', { username, password }).then(r => r.data);

// ── Patients ───────────────────────────────────────────────────────────────

export const getPatients = () =>
  api.get<Patient[]>('/api/patients').then(r => r.data);

export const getPatient = (id: number) =>
  api.get<Patient>(`/api/patients/${id}`).then(r => r.data);

export const createPatient = (data: Omit<Patient, 'id' | 'createdAt'>) =>
  api.post<Patient>('/api/patients', data).then(r => r.data);

export const updatePatient = (id: number, data: Omit<Patient, 'id' | 'createdAt'>) =>
  api.put<Patient>(`/api/patients/${id}`, data).then(r => r.data);

export const deletePatient = (id: number) =>
  api.delete(`/api/patients/${id}`);

// ── Reports ────────────────────────────────────────────────────────────────

export const getReports = () =>
  api.get<MedicalReport[]>('/api/reports').then(r => r.data);

export const getReport = (id: number) =>
  api.get<MedicalReport>(`/api/reports/${id}`).then(r => r.data);

export const getReportsByPatient = (patientId: number) =>
  api.get<MedicalReport[]>(`/api/reports/patient/${patientId}`).then(r => r.data);

export const createReport = (data: {
  patientId: number;
  reportType: string;
  consultationDate: string;
  cid10Codes: string[];
  diagnosis: string;
  clinicalPicture: string;
  treatment: string;
  medications: Medication[];
  conclusion: string;
}) => api.post<MedicalReport>('/api/reports', data).then(r => r.data);

export const updateReport = (id: number, data: {
  patientId: number;
  reportType: string;
  consultationDate: string;
  cid10Codes: string[];
  diagnosis: string;
  clinicalPicture: string;
  treatment: string;
  medications: Medication[];
  conclusion: string;
}) => api.put<MedicalReport>(`/api/reports/${id}`, data).then(r => r.data);

export const downloadReportPdf = async (id: number, patientName?: string) => {
  const response = await api.get(`/api/reports/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  const fileName = patientName
    ? `laudo_${patientName.replace(/\s+/g, '_')}_${id}.pdf`
    : `laudo_${id}.pdf`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ── Users (Admin) ──────────────────────────────────────────────────────────

export const getUsers = () =>
  api.get<AppUser[]>('/api/users').then(r => r.data);

export const createUser = (data: {
  username: string;
  password: string;
  role: string;
  fullName: string;
  crm?: string;
}) => api.post<AppUser>('/api/users', data).then(r => r.data);

export const updateUser = (id: number, data: {
  password?: string;
  role: string;
  fullName: string;
  crm?: string;
  isActive: boolean;
}) => api.put<AppUser>(`/api/users/${id}`, data).then(r => r.data);

export const deleteUser = (id: number) =>
  api.delete(`/api/users/${id}`);
