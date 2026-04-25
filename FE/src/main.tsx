import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage/HomePage';
import { FindFieldPage } from './pages/FindFieldPage/FindFieldPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { RegisterPage } from './pages/Customer/RegisterPage';
import { ForgotPasswordPage } from './pages/Customer/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/Customer/ResetPasswordPage';
import { ProfilePage } from './pages/Customer/ProfilePage';
import { OwnerDashboardScreen } from './pages/Owner/OwnerDashboardScreen';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/owner/dashboard" element={<OwnerDashboardScreen />} />
        <Route
          path="/profile"
          element={
            <Layout>
              <ProfilePage />
            </Layout>
          }
        />
        <Route
          path="/home"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
        <Route
          path="/tim-san"
          element={
            <Layout>
              <FindFieldPage />
            </Layout>
          }
        />
        <Route
          path="*"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
