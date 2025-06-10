# Next.js Cloud Run Demo

A demonstration Next.js application showcasing Google Cloud Run features including autoscaling, health checks, secret management, and environment configuration.

**Live Demo**: https://nextjs-cloud-run-demo-843666072335.us-central1.run.app

## Features

- **Health Check Endpoint** - `/api/health` for Cloud Run health monitoring
- **System Information** - Displays Cloud Run environment variables and system info
- **CPU Stress Test** - Demonstrates autoscaling capabilities
- **Secret Manager Integration** - Create and retrieve secrets securely
- **AI Chatbot** - OpenAI GPT-3.5 Turbo integration with secure API key management
- **Responsive UI** - Modern interface built with Tailwind CSS
- **Production-Ready** - Optimized Docker build with multi-stage process

## Prerequisites

- Node.js 18+ (for local development)
- Docker (for containerization)
- Google Cloud SDK (`gcloud` CLI)
- A Google Cloud Project with billing enabled
- Docker Buildx (for ARM Mac users)

## Environment Variables

Set your Google Cloud project ID:
```bash
export GCP_PROJECT_ID=your-project-id
```

This environment variable is used throughout the deployment process and scripts.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Cloud Run

### Quick Deploy

1. Set your Google Cloud project ID as an environment variable:
   ```bash
   export GCP_PROJECT_ID=your-project-id
   # Example: export GCP_PROJECT_ID=halogen-basis-461109-u8
   ```

2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

The deployment script will use the `GCP_PROJECT_ID` environment variable automatically.

### Manual Deployment

1. Set your project ID (if not already set):
   ```bash
   export GCP_PROJECT_ID=your-project-id
   ```

2. Build the Docker image:
   ```bash
   # For ARM-based Macs (Apple Silicon) - REQUIRED for Cloud Run
   docker buildx build --platform linux/amd64 -t gcr.io/${GCP_PROJECT_ID}/nextjs-cloud-run-demo .
   
   # For Intel/AMD systems
   docker build -t gcr.io/${GCP_PROJECT_ID}/nextjs-cloud-run-demo .
   ```

3. Push to Google Container Registry:
   ```bash
   docker push gcr.io/${GCP_PROJECT_ID}/nextjs-cloud-run-demo
   ```

4. Deploy to Cloud Run:
   ```bash
   gcloud run deploy nextjs-cloud-run-demo \
     --image gcr.io/${GCP_PROJECT_ID}/nextjs-cloud-run-demo \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GOOGLE_CLOUD_PROJECT=${GCP_PROJECT_ID}"
   ```

## Testing Cloud Run Features

### 1. Health Checks
- Cloud Run automatically checks `/api/health`
- Monitor health status in the Cloud Console

### 2. Autoscaling
- Click "Run Stress Test" multiple times
- Open multiple browser tabs and run tests simultaneously
- Watch instance count increase in Cloud Console

### 3. Environment Variables
The app displays Cloud Run-specific environment variables:
- `K_SERVICE` - Service name
- `K_REVISION` - Revision name
- `K_CONFIGURATION` - Configuration name

### 4. Request Handling
- Test concurrent requests to see load distribution
- Monitor request latency in Cloud Console metrics

### 5. Secret Manager
- Create secrets using the web interface
- Retrieve secrets securely
- The deployment script automatically:
  - Enables Secret Manager API
  - Creates a demo secret
  - Grants the Cloud Run service account access

#### Testing Secret Manager:
```bash
# Create a secret manually
echo -n "my-secret-value" | gcloud secrets create test-secret --data-file=-

# Get your Cloud Run service account
SERVICE_ACCOUNT=$(gcloud run services describe nextjs-cloud-run-demo \
  --region=us-central1 \
  --format='value(spec.template.spec.serviceAccountName)')

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding test-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# Use the web UI to retrieve the secret
```

## Configuration Options

### Memory and CPU
Edit `deploy.sh` or use gcloud commands:
```bash
--memory 256Mi|512Mi|1Gi|2Gi|4Gi|8Gi
--cpu 1|2|4
```

### Concurrency
Control requests per container:
```bash
--concurrency 80  # Default
--concurrency 1000 # High concurrency
```

### Scaling
Configure min/max instances:
```bash
--min-instances 0   # Scale to zero
--max-instances 100 # Maximum instances
```

## Monitoring

### View Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nextjs-cloud-run-demo" --limit 50
```

### View Metrics
Visit the [Cloud Console](https://console.cloud.google.com/run) to see:
- Request count and latency
- Instance count and CPU utilization
- Memory usage
- Error rates

## Cost Optimization

- **Scale to Zero**: No charges when not in use
- **Request-based Billing**: Pay only for actual usage
- **Efficient Containers**: Optimized image size (~150MB)

## Troubleshooting

### Build Fails
- Ensure Docker daemon is running
- Check Node.js version compatibility
- Create a `public` directory if missing: `mkdir -p public`

### Deployment Fails
- Verify gcloud authentication: `gcloud auth list`
- Check project permissions
- Ensure APIs are enabled
- **Architecture Mismatch**: If you see "Container manifest type must support amd64/linux", use `docker buildx build --platform linux/amd64`
- **Wrong Project**: Ensure your image registry project matches your deployment project

### ARM Mac (Apple Silicon) Issues
Cloud Run requires AMD64/Linux images. Always build with:
```bash
docker buildx build --platform linux/amd64 -t gcr.io/PROJECT_ID/IMAGE_NAME .
```

### High Latency
- Increase memory allocation
- Enable min-instances for warm starts
- Check region proximity to users

## Project Structure

```
test-gcp/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── chat/         # AI chatbot endpoint
│   │   ├── health/       # Health check endpoint
│   │   ├── info/         # System information
│   │   ├── secrets/      # Secret Manager demo
│   │   └── stress/       # CPU stress test
│   ├── page.tsx          # Main dashboard
│   └── layout.tsx        # Root layout
├── Dockerfile            # Multi-stage build
├── deploy.sh            # Deployment automation
└── package.json         # Dependencies
```

## Learn More

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [GitHub Repository](https://github.com/marcus888-techstack/test-gcp)