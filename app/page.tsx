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
  message?: string
  error?: string
  hint?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatResponse {
  success?: boolean
  message?: string
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState<string>('')
  const [isChatLoading, setIsChatLoading] = useState(false)

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

  const sendChatMessage = async () => {
    if (!currentMessage.trim() || isChatLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsChatLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage })
      })

      const data: ChatResponse = await response.json()

      if (data.success && data.message) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString()
        }
        setChatMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to get response'}${data.hint ? ` (${data.hint})` : ''}`,
          timestamp: new Date().toISOString()
        }
        setChatMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Failed to send message. Please try again.',
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
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

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            AI Chatbot Demo
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Chat with an AI assistant powered by OpenAI GPT-3.5 Turbo. The API key is securely stored in Google Cloud Secret Manager.
          </p>
          
          <div className="border rounded-lg h-96 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 text-center">Start a conversation...</p>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border shadow-sm'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm rounded-lg px-4 py-2 max-w-xs">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your message..."
                  disabled={isChatLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={isChatLoading || !currentMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isChatLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
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
            <li>• For the chatbot, make sure OPENAI_API_KEY secret exists in Secret Manager</li>
          </ul>
        </div>
      </div>
    </main>
  )
}