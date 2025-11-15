import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import NotFound404 from './components/NotFound404';
import './App.css'

function App() {
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

  return (
    <>
      {is404 ? <NotFound404 /> : <Dashboard />}
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
