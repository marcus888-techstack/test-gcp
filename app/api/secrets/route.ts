import { NextRequest, NextResponse } from 'next/server'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

// Initialize the Secret Manager client
let client: SecretManagerServiceClient | null = null

function getSecretManagerClient() {
  if (!client) {
    try {
      client = new SecretManagerServiceClient()
    } catch (error) {
      console.error('Failed to initialize Secret Manager client:', error)
      return null
    }
  }
  return client
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secretName = searchParams.get('name')
  
  // If no secret name provided, return info about Secret Manager
  if (!secretName) {
    return NextResponse.json({
      status: 'ready',
      message: 'Secret Manager API is available. Pass ?name=SECRET_NAME to retrieve a secret.',
      projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'not-set',
      isAuthenticated: !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.K_SERVICE,
      tips: [
        'Create a secret: gcloud secrets create demo-secret --data-file=- <<< "my-secret-value"',
        'Grant access: gcloud secrets add-iam-policy-binding demo-secret --member=serviceAccount:YOUR_SERVICE_ACCOUNT --role=roles/secretmanager.secretAccessor',
        'Access secret: GET /api/secrets?name=demo-secret'
      ]
    })
  }

  try {
    const client = getSecretManagerClient()
    if (!client) {
      return NextResponse.json(
        { 
          error: 'Secret Manager not available',
          hint: 'This typically works when deployed to Cloud Run with proper IAM permissions'
        },
        { status: 503 }
      )
    }

    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT
    if (!projectId) {
      return NextResponse.json(
        { 
          error: 'Project ID not found',
          hint: 'Set GOOGLE_CLOUD_PROJECT or GCP_PROJECT environment variable'
        },
        { status: 400 }
      )
    }

    // Build the resource name
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`

    // Access the secret
    const [version] = await client.accessSecretVersion({ name })
    
    // Extract the payload
    const payload = version.payload?.data?.toString()

    return NextResponse.json({
      success: true,
      secretName,
      secretValue: payload,
      version: version.name?.split('/').pop(),
      timestamp: new Date().toISOString(),
      note: 'In production, never expose secret values in API responses!'
    })
  } catch (error) {
    console.error('Secret Manager error:', error)
    
    let errorMessage = 'Failed to access secret'
    let hint = ''
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        errorMessage = `Secret '${secretName}' not found`
        hint = `Create it with: gcloud secrets create ${secretName} --data-file=- <<< "your-secret-value"`
      } else if (error.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permission denied'
        hint = 'Grant the Cloud Run service account access to Secret Manager'
      } else if (error.message.includes('Could not load the default credentials')) {
        errorMessage = 'Authentication not configured'
        hint = 'This works when deployed to Cloud Run. For local testing, set up Application Default Credentials'
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, value } = body

    if (!name || !value) {
      return NextResponse.json(
        { error: 'Both name and value are required' },
        { status: 400 }
      )
    }

    const client = getSecretManagerClient()
    if (!client) {
      return NextResponse.json(
        { 
          error: 'Secret Manager not available',
          hint: 'This typically works when deployed to Cloud Run with proper IAM permissions'
        },
        { status: 503 }
      )
    }

    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID not found' },
        { status: 400 }
      )
    }

    try {
      // Create the secret
      const [secret] = await client.createSecret({
        parent: `projects/${projectId}`,
        secretId: name,
        secret: {
          replication: {
            automatic: {},
          },
        },
      })

      // Add a version with the secret value
      const [version] = await client.addSecretVersion({
        parent: secret.name,
        payload: {
          data: Buffer.from(value, 'utf8'),
        },
      })

      return NextResponse.json({
        success: true,
        message: `Secret '${name}' created successfully`,
        secretName: secret.name,
        versionName: version.name,
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        return NextResponse.json(
          { 
            error: `Secret '${name}' already exists`,
            hint: 'Use a different name or delete the existing secret first'
          },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Failed to create secret:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create secret',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}