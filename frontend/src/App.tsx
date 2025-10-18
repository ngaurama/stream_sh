import { Route, Routes } from 'react-router';
import { useAuth } from './contexts/useAuth';
import Header from './components/Header';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Register from './pages/Register';
import StreamPage from './pages/StreamPage';
import FollowedSidebar from './components/FollowedSidebar';
import { useState } from 'react';
import CreateStream from './pages/CreateStream';
import AccountPage from './pages/AccountPage';

function App() {
  const { loading, user } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <div className="flex pt-16 min-h-screen">
        {user && (
          <div className="fixed left-0 top-18 h-[calc(100vh-4.5rem)] z-30">
            <FollowedSidebar
              isExpanded={isSidebarExpanded}
              setIsExpanded={setIsSidebarExpanded}
            />
          </div>
        )}

        <div
          className={`flex-1 min-w-0 transition-all duration-300`}
          style={{
            marginLeft: user ? (isSidebarExpanded ? '20rem' : '4rem') : '0',
          }}
        >
          <main>
            <Routes>
              <Route index element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/stream/:id" element={<StreamPage />} />
              <Route path="/stream/create" element={<CreateStream />} />
              <Route path="/account" element={<AccountPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
