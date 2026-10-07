import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const ResumePage = lazy(() => import('./pages/ResumePage'));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage'));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const MockInterviewPage = lazy(() => import('./pages/MockInterviewPage'));
const JobMatchPage = lazy(() => import('./pages/JobMatchPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const LearningPlanPage = lazy(() => import('./pages/LearningPlanPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

export default function App() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading...</div>}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/mock-interview" element={<MockInterviewPage />} />
          <Route path="/mock-interview/:id" element={<MockInterviewPage />} />
          <Route path="/job-match" element={<JobMatchPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/learning-plan" element={<LearningPlanPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<DashboardLayout />}><Route path="/admin" element={<AdminPage />} /></Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  );
}
