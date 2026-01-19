import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CardLibrary from './pages/CardLibrary';
import CardDetail from './pages/CardDetail';
import Reading from './pages/Reading';
import ReadingSession from './pages/ReadingSession';
import ReadingResult from './pages/ReadingResult';
import History from './pages/History';
import DailyCard from './pages/DailyCard';
import Profile from './pages/Profile';

function App() {
  const { checkAuth, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      checkAuth();
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="cards" element={<CardLibrary />} />
        <Route path="cards/:id" element={<CardDetail />} />

        {/* Protected Routes */}
        <Route path="reading" element={
          <ProtectedRoute>
            <Reading />
          </ProtectedRoute>
        } />
        <Route path="reading/session" element={
          <ProtectedRoute>
            <ReadingSession />
          </ProtectedRoute>
        } />
        <Route path="reading/result/:id" element={
          <ProtectedRoute>
            <ReadingResult />
          </ProtectedRoute>
        } />
        <Route path="history" element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        } />
        <Route path="daily" element={
          <ProtectedRoute>
            <DailyCard />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;
