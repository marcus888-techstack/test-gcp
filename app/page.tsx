'use client'

import { useState, useEffect } from 'react'

interface SystemInfo {
  service: string
  revision: string
  configuration: string
  region?: string
  projectId?: string
  memory?: string
  cpu?: string
  timestamp: string
}

interface StressTestResult {
  duration: number
  iterations: number
  cpuTime: number
}

interface SecretResult {
  success?: boolean
  secretName?: string
  secretValue?: string
  error?: string
  hint?: string
}

export default function Home() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [healthStatus, setHealthStatus] = useState<string>('checking...')
  const [stressTestResult, setStressTestResult] = useState<StressTestResult | null>(null)
  const [isStressTesting, setIsStressTesting] = useState(false)
  const [secretName, setSecretName] = useState<string>('demo-secret')
  const [secretValue, setSecretValue] = useState<string>('my-secret-value')
  const [secretResult, setSecretResult] = useState<SecretResult | null>(null)
  const [isLoadingSecret, setIsLoadingSecret] = useState(false)

  useEffect(() => {
    fetchSystemInfo()
    checkHealth()
  }, [])

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/info')
      const data = await response.json()
      setSystemInfo(data)
    } catch (error) {
      console.error('Failed to fetch system info:', error)
    }
  }

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthStatus(data.status)
    } catch (error) {
      setHealthStatus('error')
    }
  }

  const runStressTest = async () => {
    setIsStressTesting(true)
    setStressTestResult(null)
    try {
      const response = await fetch('/api/stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iterations: 10000000 })
      })
      const data = await response.json()
      setStressTestResult(data)
    } catch (error) {
      console.error('Stress test failed:', error)
    } finally {
      setIsStressTesting(false)
    }
  }

  const createSecret = async () => {
    setIsLoadingSecret(true)
    setSecretResult(null)
    try {
      const response = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: secretName, value: secretValue })
      })
      const data = await response.json()
      setSecretResult(data)
    } catch (error) {
      setSecretResult({ error: 'Failed to create secret' })
    } finally {
      setIsLoadingSecret(false)
    }
  }

  const retrieveSecret = async () => {
    setIsLoadingSecret(true)
    setSecretResult(null)
    try {
      const response = await fetch(`/api/secrets?name=${secretName}`)
      const data = await response.json()
      setSecretResult(data)
    } catch (error) {
      setSecretResult({ error: 'Failed to retrieve secret' })
    } finally {
      setIsLoadingSecret(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Google Cloud Run Demo
          </h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Health Status
            </h2>
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-2 ${
                healthStatus === 'healthy' ? 'bg-green-500' : 
                healthStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-gray-700 capitalize">{healthStatus}</span>
            </div>
          </div>

          {systemInfo && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                System Information
              </h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Service</dt>
                  <dd className="mt-1 text-sm text-gray-900">{systemInfo.service}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Revision</dt>
                  <dd className="mt-1 text-sm text-gray-900">{systemInfo.revision}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Configuration</dt>
                  <dd className="mt-1 text-sm text-gray-900">{systemInfo.configuration}</dd>
                </div>
                {systemInfo.region && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Region</dt>
                    <dd className="mt-1 text-sm text-gray-900">{systemInfo.region}</dd>
                  </div>
                )}
                {systemInfo.memory && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Memory Limit</dt>
                    <dd className="mt-1 text-sm text-gray-900">{systemInfo.memory}</dd>
                  </div>
                )}
                {systemInfo.cpu && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">CPU Limit</dt>
                    <dd className="mt-1 text-sm text-gray-900">{systemInfo.cpu}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              CPU Stress Test
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Run a CPU-intensive task to test Cloud Run's autoscaling capabilities.
            </p>
            <button
              onClick={runStressTest}
              disabled={isStressTesting}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isStressTesting ? 'Running...' : 'Run Stress Test'}
            </button>
            
            {stressTestResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-700">
                  <strong>Duration:</strong> {stressTestResult.duration.toFixed(2)}ms
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Iterations:</strong> {stressTestResult.iterations.toLocaleString()}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>CPU Time:</strong> {stressTestResult.cpuTime.toFixed(2)}ms
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Secret Manager Demo
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Test Google Cloud Secret Manager integration. Create and retrieve secrets securely.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Name
              </label>
              <input
                type="text"
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="demo-secret"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Value (for creation only)
              </label>
              <input
                type="text"
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="my-secret-value"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={createSecret}
                disabled={isLoadingSecret}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoadingSecret ? 'Loading...' : 'Create Secret'}
              </button>
              
              <button
                onClick={retrieveSecret}
                disabled={isLoadingSecret}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoadingSecret ? 'Loading...' : 'Retrieve Secret'}
              </button>
            </div>
            
            {secretResult && (
              <div className={`mt-4 p-4 rounded ${secretResult.error ? 'bg-red-50' : 'bg-green-50'}`}>
                {secretResult.error ? (
                  <>
                    <p className="text-sm text-red-700 font-semibold">Error: {secretResult.error}</p>
                    {secretResult.hint && (
                      <p className="text-sm text-red-600 mt-1">{secretResult.hint}</p>
                    )}
                  </>
                ) : (
                  <>
                    {secretResult.success && (
                      <p className="text-sm text-green-700 font-semibold">
                        {secretResult.message || 'Secret operation successful!'}
                      </p>
                    )}
                    {secretResult.secretValue && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">
                          <strong>Secret Value:</strong> {secretResult.secretValue}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Note: In production, never expose secret values in API responses!
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            Testing Tips
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Monitor the Cloud Run metrics to see autoscaling in action</li>
            <li>• Run multiple stress tests simultaneously to trigger scaling</li>
            <li>• Check the logs in Cloud Console for detailed information</li>
            <li>• Try different memory/CPU configurations in Cloud Run</li>
          </ul>
        </div>
      </div>
    </main>
  )
}