function NotFound404() {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="text-center max-w-lg w-full">
        {/* 404 Icon - Browser Window with {404} */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            {/* Browser Window - Minimalist style like LeetCode */}
            <div className="w-72 h-52 bg-dark-bg border border-dark-border rounded-lg p-5">
              {/* Browser Controls - Three dots */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-dark-text-muted"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-dark-text-muted"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-dark-text-muted"></div>
                </div>
                {/* URL Bar */}
                <div className="flex-1 h-3.5 bg-dark-bg-secondary rounded border border-dark-border"></div>
              </div>
              
              {/* 404 Text - Large, bold, monospace */}
              <div className="flex items-center justify-center h-36">
                <span className="text-7xl font-bold text-dark-text-secondary font-mono tracking-tight">
                  {'{404}'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-dark-text mb-3">
          Page Not Found
        </h1>
        <p className="text-base sm:text-lg text-dark-text-secondary mb-10">
          Sorry, but we can't find the page you are looking for...
        </p>

        {/* Go Home Button */}
        <button
          onClick={handleGoHome}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export default NotFound404;

