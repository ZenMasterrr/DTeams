// Global error handler to suppress Reown configuration errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  
  console.error = (...args) => {
    // Filter out Reown configuration errors
    const shouldIgnore = args.some(arg => 
      typeof arg === 'string' && 
      (arg.includes('@reown') || 
       arg.includes('Failed to fetch remote project configuration'))
    );
    
    if (!shouldIgnore) {
      originalConsoleError.apply(console, args);
    }
  };

  // Also handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && 
        typeof event.reason.message === 'string' && 
        event.reason.message.includes('@reown')) {
      event.preventDefault();
    }
  });
}
