// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './hooks/useAuth';
// import LoginPage from './pages/LoginPage';
// import DashboardPage from './pages/DashboardPage';
// import ProfilePage from './pages/ProfilePage';

// function ProtectedRoute({ children }) {
//   const { user, loading } = useAuth();
//   if (loading) return (
//     <div style={{
//       display: 'flex', alignItems: 'center', justifyContent: 'center',
//       height: '100vh', background: '#0a0a0f', color: '#00ff88', fontSize: 14,
//       fontFamily: 'monospace', letterSpacing: 2
//     }}>
//       INITIALIZING...
//     </div>
//   );
//   return user ? children : <Navigate to="/login" replace />;
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Routes>
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/" element={
//             <ProtectedRoute><DashboardPage /></ProtectedRoute>
//           } />
//           <Route path="/profile/:profileName" element={
//             <ProtectedRoute><ProfilePage /></ProtectedRoute>
//           } />
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }


import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { GameProvider } from './hooks/useGame';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage   from './pages/ProfilePage';

// Each user has exactly one profile — "Profile_1" — namespaced by their userId
// on the backend. Two users both using "Profile_1" never share data.
export const USER_PROFILE = 'Profile_1';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0a0f', color: '#00ff88', fontSize: 14,
      fontFamily: 'monospace', letterSpacing: 2
    }}>
      INITIALIZING...
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Dashboard — shows this user's single profile overview */}
          <Route path="/" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />

          {/* Profile page — each user only ever accesses their own Profile_1 */}
          <Route path="/profile/:profileName" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          {/* Redirect anything unknown to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </GameProvider>
    </AuthProvider>
  );
}
