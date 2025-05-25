'use client';

import { useState } from 'react';
import { testSparqlConnection, exploreSparqlSchema } from '@/lib/sparql-api';

export default function DebugPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [schemaResult, setSchemaResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const result = await testSparqlConnection();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(`오류 발생: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExploreSchema = async () => {
    setLoading(true);
    try {
      const result = await exploreSparqlSchema();
      setSchemaResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setSchemaResult(`오류 발생: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8">SPARQL 디버깅 페이지</h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">1. SPARQL 연결 테스트</h2>
            <button
              onClick={handleTestConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '테스트 중...' : '연결 테스트'}
            </button>
            {testResult && (
              <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {testResult}
              </pre>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">2. 스키마 탐색</h2>
            <button
              onClick={handleExploreSchema}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '탐색 중...' : '스키마 탐색'}
            </button>
            {schemaResult && (
              <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {schemaResult}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 