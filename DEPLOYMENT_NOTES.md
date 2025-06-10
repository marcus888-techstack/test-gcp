# Deployment Notes - Next.js Cloud Run Demo

## Successful Deployment

**Live URL**: https://nextjs-cloud-run-demo-843666072335.us-central1.run.app

**Project**: halogen-basis-461109-u8  
**Region**: us-central1  
**Service**: nextjs-cloud-run-demo  

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
**Alternative**: Use buildx with --push flag to build and push in one step:
```bash
docker buildx build --platform linux/amd64 -t gcr.io/PROJECT_ID/IMAGE_NAME --push .
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

## Successful Deployment Commands

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
     --allow-unauthenticated \
     --set-env-vars="GOOGLE_CLOUD_PROJECT=halogen-basis-461109-u8"
   ```

3. **Grant Secret Manager Access** (if not using deploy.sh):
   ```bash
   # Get the service account
   SERVICE_ACCOUNT=$(gcloud run services describe nextjs-cloud-run-demo \
     --region=us-central1 \
     --format='value(spec.template.spec.serviceAccountName)')
   
   # Grant access to secrets
   gcloud secrets add-iam-policy-binding demo-secret \
     --member="serviceAccount:${SERVICE_ACCOUNT}" \
     --role="roles/secretmanager.secretAccessor"
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
6. Use `docker buildx build --push` to build and push in one command
7. Set GOOGLE_CLOUD_PROJECT environment variable for Secret Manager

## Useful Links

- **Live Demo**: https://nextjs-cloud-run-demo-843666072335.us-central1.run.app
- **GitHub Repository**: https://github.com/marcus888-techstack/test-gcp
- **Cloud Run Console**: https://console.cloud.google.com/run/detail/us-central1/nextjs-cloud-run-demo/metrics?project=halogen-basis-461109-u8