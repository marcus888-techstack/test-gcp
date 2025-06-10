# Chatbot Setup Instructions

## Setting Up the OpenAI API Key

To enable the chatbot functionality, you need to create the OpenAI API key secret in Google Cloud Secret Manager.

### Method 1: Manual Secret Creation

```bash
# Set your project
export GCP_PROJECT_ID=your-project-id
gcloud config set project ${GCP_PROJECT_ID}

# Create the OpenAI API key secret (replace with your actual API key)
echo -n "your-actual-openai-api-key" | gcloud secrets create OPENAI_API_KEY --data-file=-
```

### Method 2: Using Environment Variable with Deployment Script

```bash
# Set the API key as an environment variable (replace with your actual key)
export OPENAI_API_KEY="your-actual-openai-api-key"

# Run the deployment script - it will automatically create the secret
./deploy.sh
```

**Note**: The actual API key has been provided separately for security reasons.

## Verification

Verify the secret was created successfully:

```bash
# List secrets to verify creation
gcloud secrets list | grep OPENAI_API_KEY

# View secret metadata (not the actual value)
gcloud secrets describe OPENAI_API_KEY
```

## Testing the Chatbot

After deployment:

1. Visit your deployed application
2. Scroll down to the "AI Chatbot Demo" section
3. Type a message and press Enter or click Send
4. The chatbot will respond using GPT-3.5 Turbo

## Troubleshooting

- If you get "OpenAI API key not available" error, verify the secret exists:
  ```bash
  gcloud secrets list | grep OPENAI_API_KEY
  ```

- Check Cloud Run service account has access:
  ```bash
  gcloud secrets get-iam-policy OPENAI_API_KEY
  ```

- View logs for detailed error messages:
  ```bash
  gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nextjs-cloud-run-demo" --limit 10
  ```

## Security Notes

- The OpenAI API key is securely stored in Google Cloud Secret Manager
- Access is granted only to the Cloud Run service account
- The key is cached for 5 minutes to optimize performance
- Never commit API keys to version control