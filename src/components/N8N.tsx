import { useState, useEffect } from 'react';
import { X, RefreshCw, RotateCw } from 'lucide-react';

const N8N = () => {
  const [setupStatus, setSetupStatus] = useState<'not-started' | 'checking-node' | 'installing-n8n' | 'completed' | 'error'>('not-started');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    const checkN8nStatus = async () => {
      try {
        // @ts-expect-error - window.electron is injected by preload script
        const result = await window.electron.checkN8NRunning();
        setShowSidebar(!result.running);
        setShowIframe(result.running);
        if (result.running) {
          setSetupStatus('completed');
        }
      } catch (err) {
        console.error('Error checking n8n status:', err);
        setShowSidebar(true);
        setShowIframe(false);
      }
    };

    checkN8nStatus();
  }, []);

  useEffect(() => {
    // @ts-expect-error - window.electron is injected by preload script
    window.electron.onN8NInstallOutput((data: { type: string; data: string }) => {
      const lines = data.data.split('\n');
      lines.forEach((line: string) => {
        if (line.trim()) {
          setLogs(prev => [...prev, line.trim()]);
          // Check if n8n is ready and running
          if (line.includes('n8n ready on') && line.includes('port 5678')) {
            setSetupStatus('completed');
            setShowSidebar(false);
            setShowIframe(true);
          }
        }
      });
    });

    return () => {
      // @ts-expect-error - window.electron is injected by preload script
      window.electron.removeN8NInstallOutputListener();
    };
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const refreshN8N = async () => {
    try {
      // @ts-expect-error - window.electron is injected by preload script
      const result = await window.electron.checkN8NRunning();
      if (result.running) {
        setShowIframe(true);
        setShowSidebar(false);
        setIframeLoaded(false);
      } else {
        setShowIframe(false);
        setShowSidebar(true);
      }
    } catch (err) {
      console.error('Error refreshing n8n status:', err);
      setShowIframe(false);
      setShowSidebar(true);
    }
  };

  const startSetup = async () => {
    setSetupStatus('checking-node');
    addLog('Checking if Node.js is installed...');
    
    try {
      // @ts-expect-error - window.electron is injected by preload script
      const result = await window.electron.checkNodeInstallation();
      
      if (result.installed) {
        addLog(`Node.js version: ${result.nodeVersion}`);
        addLog(`npm version: ${result.npmVersion}`);
        addLog('Node.js is installed!');
        setSetupStatus('installing-n8n');
        addLog('Installing n8n...');
        
        try {
          // @ts-expect-error - window.electron is injected by preload script
          await window.electron.installN8N();
        } catch (installError) {
          const errorMessage = installError instanceof Error ? installError.message : 'Unknown error occurred during installation';
          setError(errorMessage);
          setSetupStatus('error');
          addLog('Error: ' + errorMessage);
        }
      } else {
        setError(result.error);
        setSetupStatus('error');
        addLog('Error: ' + result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setSetupStatus('error');
      addLog('Error: ' + errorMessage);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden m-0 p-0 -m-6">
      {/* Left sidebar with setup */}
      <div 
        className={`w-1/3 h-full flex flex-col glassmorphic rounded-lg overflow-hidden transition-all duration-300 fixed left-0 top-16 z-10 ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } hover:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">N8N Setup</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshN8N}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              title="Refresh N8N Status"
            >
              <RefreshCw className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto">
          <p className="text-gray-700 dark:text-gray-300">
            N8N is a workflow automation tool that allows you to connect different services and automate tasks.
            Let's set it up for you.
          </p>

          {setupStatus === 'not-started' && (
            <button
              onClick={startSetup}
              className="bg-sakura-500 text-white px-4 py-2 rounded-lg hover:bg-sakura-600 transition-colors"
            >
              Start Setup
            </button>
          )}

          {setupStatus !== 'not-started' && (
            <div className="space-y-4">
              <div className="h-96 overflow-y-auto bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <div className="text-gray-400 mb-2">$ npx n8n</div>
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`text-gray-300 ${log.startsWith('Error:') ? 'text-red-400' : ''}`}
                  >
                    {log}
                  </div>
                ))}
                {setupStatus === 'installing-n8n' && (
                  <div className="text-gray-400 animate-pulse">Installing...</div>
                )}
              </div>

              {setupStatus === 'completed' && (
                <div className="text-green-500">
                  Setup completed successfully! N8N is now running.
                </div>
              )}

              {setupStatus === 'error' && (
                <div className="text-red-500">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content - n8n web interface */}
      <div className="h-full w-full m-0 p-0">
        {showIframe ? (
          <div className="relative w-full h-full m-0 p-0">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    N8N interface is taking longer than expected to load.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Please try pressing <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Ctrl + R</span> to refresh the page.
                  </p>
                  <button
                    onClick={() => setIframeLoaded(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 transition-colors"
                  >
                    <RotateCw className="w-5 h-5" />
                    Reload N8N Interface
                  </button>
                </div>
              </div>
            )}
            <iframe
              src="http://localhost:5678"
              className="absolute inset-0 w-full h-full border-0 m-0 p-0"
              title="n8n Web Interface"
              onLoad={() => setIframeLoaded(true)}
              onError={() => setIframeLoaded(false)}
              style={{ overflow: 'hidden' }}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">N8N is not running</p>
              <button
                onClick={refreshN8N}
                className="flex items-center gap-2 px-4 py-2 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Check Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default N8N; 