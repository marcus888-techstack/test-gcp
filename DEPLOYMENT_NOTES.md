# Deployment Notes - Next.js Cloud Run Demo

## Known Issues and Solutions

### 1. Missing Public Directory
**Error**: `"/app/public": not found`
**Solution**: Create the public directory before building:
```bash
mkdir -p public
```

### 2. ARM Architecture on Apple Silicon Macs
**Error**: `Container manifest type 'application/vnd.oci.image.index.v1+json' must support amd64/linux`
**Solution**: Build with the correct platform:
```bash
docker buildx build --platform linux/amd64 -t gcr.io/PROJECT_ID/IMAGE_NAME .
```

### 3. Dockerfile ENV Syntax Warnings
**Warning**: `Legacy key/value format with whitespace separator should not be used`
**Solution**: Use `ENV KEY=VALUE` format instead of `ENV KEY VALUE`

### 4. Cross-Project Deployment Issues
**Error**: `Permission "artifactregistry.repositories.downloadArtifacts" denied`
**Solution**: Deploy to the same project where the image is stored, or grant cross-project permissions:
```bash
gcloud projects add-iam-policy-binding SOURCE_PROJECT \
  --member="serviceAccount:service-NUMBER@serverless-robot-prod.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

## Successful Deployment Example

1. **Build for AMD64** (on ARM Mac):
   ```bash
   docker buildx build --platform linux/amd64 -t gcr.io/halogen-basis-461109-u8/nextjs-cloud-run-demo --push .
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy nextjs-cloud-run-demo \
     --image gcr.io/halogen-basis-461109-u8/nextjs-cloud-run-demo \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## Quick Commands

### Check Image Architecture
```bash
docker manifest inspect gcr.io/PROJECT_ID/IMAGE_NAME | grep -A 2 "platform"
```

### View Cloud Run Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nextjs-cloud-run-demo" --limit 50
```

### Check Service Status
```bash
gcloud run services describe nextjs-cloud-run-demo --region us-central1
```

## Best Practices

1. Always use `--platform linux/amd64` on ARM Macs
2. Keep the image registry and deployment in the same GCP project when possible
3. Use the deployment script which includes ARM detection
4. Test locally before deploying
5. Monitor Cloud Run metrics after deployment