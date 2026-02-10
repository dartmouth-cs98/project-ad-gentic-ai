'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    setHealthStatus(null);

    try {
      const response = await fetch(`${API_URL}/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setHealthStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold text-gray-800">Adgentic AI</h1>
          <p className="text-lg text-gray-600">AI-Powered Ad Generation Platform</p>
        </div>

        <div className="w-full border-t border-gray-200 my-4"></div>

        <div className="flex flex-col items-center gap-4 w-full">
          <button
            onClick={checkHealth}
            disabled={loading}
            className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {loading ? 'Checking...' : 'Check Server Health'}
          </button>

          {healthStatus && (
            <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-green-800 font-medium">
                  Server Status: <span className="font-bold uppercase">{healthStatus}</span>
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <p className="text-red-800 font-medium">
                  Error: {error}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
