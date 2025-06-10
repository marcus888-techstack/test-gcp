#!/bin/bash

# Cloud Run deployment script for Next.js application

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
SERVICE_NAME="nextjs-cloud-run-demo"
REGION="${CLOUD_RUN_REGION:-us-central1}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Cloud Run deployment...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if PROJECT_ID is set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo -e "${YELLOW}⚠️  Please set your GCP project ID:${NC}"
    echo "export GCP_PROJECT_ID=your-actual-project-id"
    echo "Or edit this script and replace 'your-project-id' with your actual project ID"
    exit 1
fi

# Set the project
echo -e "${GREEN}📋 Setting project to ${PROJECT_ID}...${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${GREEN}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Build the Docker image
echo -e "${GREEN}🏗️  Building Docker image...${NC}"
# Check if running on ARM architecture (Apple Silicon)
if [[ $(uname -m) == "arm64" ]]; then
    echo -e "${YELLOW}⚠️  Detected ARM architecture, building for linux/amd64...${NC}"
    docker buildx build --platform linux/amd64 -t ${IMAGE_NAME} .
else
    docker build -t ${IMAGE_NAME} .
fi

# Push to Google Container Registry
echo -e "${GREEN}📤 Pushing image to GCR...${NC}"
docker push ${IMAGE_NAME}

# Create a demo secret if it doesn't exist
echo -e "${GREEN}🔐 Setting up demo secret...${NC}"
if ! gcloud secrets describe demo-secret --project=${PROJECT_ID} >/dev/null 2>&1; then
    echo "demo-secret-value" | gcloud secrets create demo-secret \
        --data-file=- \
        --project=${PROJECT_ID}
    echo -e "${GREEN}✅ Created demo-secret${NC}"
else
    echo -e "${YELLOW}ℹ️  demo-secret already exists${NC}"
fi

# Deploy to Cloud Run
echo -e "${GREEN}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --timeout 60 \
    --concurrency 80 \
    --max-instances 100 \
    --min-instances 0 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"

# Grant Secret Manager access to the Cloud Run service
echo -e "${GREEN}🔑 Granting Secret Manager access...${NC}"
SERVICE_ACCOUNT=$(gcloud run services describe ${SERVICE_NAME} \
    --region=${REGION} \
    --format='value(spec.template.spec.serviceAccountName)')

if [ -n "$SERVICE_ACCOUNT" ]; then
    gcloud secrets add-iam-policy-binding demo-secret \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/secretmanager.secretAccessor" \
        --project=${PROJECT_ID}
    echo -e "${GREEN}✅ Granted Secret Manager access to ${SERVICE_ACCOUNT}${NC}"
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your service is available at: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}📊 To view logs:${NC}"
echo "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}\" --limit 50"
echo ""
echo -e "${YELLOW}📈 To view metrics in Cloud Console:${NC}"
echo "https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/metrics"