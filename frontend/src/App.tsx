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
import Saju from './pages/Saju';
import SajuResult from './pages/SajuResult';
import SajuHistory from './pages/SajuHistory';
import SajuLearn from './pages/SajuLearn';
import TarotLearn from './pages/TarotLearn';
import SajuTarotReading from './pages/SajuTarotReading';
import RagSearch from './pages/RagSearch';
import SajuGraphInsight from './pages/SajuGraphInsight';

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
        <Route path="tarot/learn" element={<TarotLearn />} />

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

        {/* Saju Routes */}
        <Route path="saju" element={
          <ProtectedRoute>
            <Saju />
          </ProtectedRoute>
        } />
        <Route path="saju/result/:id" element={
          <ProtectedRoute>
            <SajuResult />
          </ProtectedRoute>
        } />
        <Route path="saju/history" element={
          <ProtectedRoute>
            <SajuHistory />
          </ProtectedRoute>
        } />
        <Route path="saju/learn" element={
          <ProtectedRoute>
            <SajuLearn />
          </ProtectedRoute>
        } />

        {/* Saju-Tarot Integration */}
        <Route path="saju-tarot" element={
          <ProtectedRoute>
            <SajuTarotReading />
          </ProtectedRoute>
        } />

        {/* RAG Search (dev/test) */}
        <Route path="rag-search" element={<RagSearch />} />

        {/* 사주 그래프 인사이트 */}
        <Route path="saju-graph" element={<SajuGraphInsight />} />
      </Route>
    </Routes>
  );
}

export default App;
