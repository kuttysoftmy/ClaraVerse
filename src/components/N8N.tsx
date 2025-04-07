import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import type { WebviewTag } from 'electron';

const N8N = () => {
  const [n8nRunning, setN8NRunning] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkN8nStatus = async () => {
      try {
        // @ts-expect-error - window.electron is injected by preload script
        const result = await window.electron.checkN8NRunning();
        setN8NRunning(result.running);
        setError(null);
      } catch (err) {
        console.error('Error checking n8n status:', err);
        setN8NRunning(false);
        setError('Failed to check n8n status');
      }
    };

    checkN8nStatus();
    const interval = setInterval(checkN8nStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshN8N = async () => {
    try {
      setError(null);
      // @ts-expect-error - window.electron is injected by preload script
      const result = await window.electron.checkN8NRunning();
      setN8NRunning(result.running);
      if (result.running) {
        setIframeLoaded(false);
      }
    } catch (err) {
      console.error('Error refreshing n8n status:', err);
      setN8NRunning(false);
      setError('Failed to refresh n8n status');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden m-0 p-0 -m-6">
      {n8nRunning ? (
        <div className="relative w-full h-full m-0 p-0">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Loading N8N interface...
                </p>
                <button
                  onClick={refreshN8N}
                  className="flex items-center gap-2 px-4 py-2 bg-sakura-500 text-white rounded-lg hover:bg-sakura-600 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload
                </button>
              </div>
            </div>
          )}
          <webview
            src="http://localhost:5678"
            className="absolute inset-0 w-full h-full border-0"
            partition="persist:n8n"
            webpreferences="allowRunningInsecureContent=yes"
            onLoad={() => {
              setIframeLoaded(true);
              console.log('n8n webview loaded successfully');
            }}
            onError={(e) => {
              console.error('Webview loading error:', e);
              setIframeLoaded(false);
              // Try to reload the webview after a delay
              setTimeout(() => {
                const webview = document.querySelector('webview') as WebviewTag;
                if (webview) {
                  webview.reload();
                }
              }, 2000);
            }}
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              {error || 'N8N is not running'}
            </p>
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
  );
};

export default N8N; 