import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import NotFound404 from './components/NotFound404';
import AuthScreen from './components/AuthScreen';
import { useAuth } from './context/AuthContext';
import './App.css'

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [is404, setIs404] = useState(false);

  useEffect(() => {
    // Check if current path is not root
    const path = window.location.pathname;
    if (path !== '/') {
      setIs404(true);
    } else {
      setIs404(false);
    }
  }, []);

  // Listen for popstate events (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path !== '/') {
        setIs404(true);
      } else {
        setIs404(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // While verifying an existing session, show a minimal loading screen
  let content;
  if (loading) {
    content = (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-700/20 border-t-indigo-400 animate-spin" />
      </div>
    );
  } else if (!isAuthenticated) {
    content = <AuthScreen />;
  } else if (is404) {
    content = <NotFound404 />;
  } else {
    content = <Dashboard />;
  }

  return (
    <>
      {content}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}

export default App
