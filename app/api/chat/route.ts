import { NextRequest, NextResponse } from 'next/server'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import OpenAI from 'openai'

// Initialize the Secret Manager client
let secretManagerClient: SecretManagerServiceClient | null = null

function getSecretManagerClient() {
  if (!secretManagerClient) {
    try {
      secretManagerClient = new SecretManagerServiceClient()
    } catch (error) {
      console.error('Failed to initialize Secret Manager client:', error)
      return null
    }
  }
  return secretManagerClient
}

// Cache for OpenAI API key to avoid fetching on every request
let cachedOpenAIKey: string | null = null
let keyFetchTime: number = 0
const KEY_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getOpenAIKey(): Promise<string | null> {
  // Return cached key if still valid
  if (cachedOpenAIKey && Date.now() - keyFetchTime < KEY_CACHE_DURATION) {
    return cachedOpenAIKey
  }

  try {
    const client = getSecretManagerClient()
    if (!client) {
      console.error('Secret Manager client not available')
      return null
    }

    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT
    if (!projectId) {
      console.error('Project ID not found')
      return null
    }

    // Build the resource name for the OpenAI API key secret
    const secretName = `projects/${projectId}/secrets/OPENAI_API_KEY/versions/latest`

    // Access the secret
    const [version] = await client.accessSecretVersion({ name: secretName })
    const apiKey = version.payload?.data?.toString()

    if (!apiKey) {
      console.error('OpenAI API key not found in secret')
      return null
    }

    // Cache the key
    cachedOpenAIKey = apiKey
    keyFetchTime = Date.now()

    return apiKey
  } catch (error) {
    console.error('Failed to retrieve OpenAI API key from Secret Manager:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    // Get OpenAI API key from Secret Manager
    const apiKey = await getOpenAIKey()
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not available',
          hint: 'Make sure OPENAI_API_KEY secret exists in Secret Manager with proper permissions'
        },
        { status: 503 }
      )
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Create chat completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant running on Google Cloud Run. Keep responses concise and friendly.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    const responseMessage = completion.choices[0]?.message?.content

    if (!responseMessage) {
      return NextResponse.json(
        { error: 'No response generated from OpenAI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      model: completion.model,
      usage: completion.usage,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Chat API error:', error)
    
    let errorMessage = 'Failed to process chat request'
    let hint = ''
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid OpenAI API key'
        hint = 'Check that your OpenAI API key is valid and has sufficient credits'
      } else if (error.message.includes('quota')) {
        errorMessage = 'OpenAI API quota exceeded'
        hint = 'You have exceeded your OpenAI API usage limits'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded'
        hint = 'Too many requests. Please wait a moment before trying again'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        hint,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}