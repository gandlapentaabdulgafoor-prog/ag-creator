# ONEAG Environment Separation & Secret Isolation Guide

This directory establishes strict separation of configuration across development, staging, and production environments for Web, Android, and iOS clients.

## Security Mandates

1. **Zero Committed Secrets**:
   - Never commit `.env`, `*.jks`, `*.keystore`, `*.mobileprovision`, `*.p12`, or `google-services.json` containing production credentials to version control.
   - All sensitive credentials must be injected dynamically via CI/CD secrets (e.g., GitHub Actions Secrets or Google Cloud Secret Manager).

2. **Client vs. Server Separation**:
   - Clients (Web, Android Compose, iOS SwiftUI) only receive public environment flags and API base URLs.
   - Private keys, partner affiliate secrets, and Google service account keys reside strictly on the server backend.

3. **Android Flavor Separation**:
   - `dev`: Builds `com.oneag.app.dev`, connects to dev API, debuggable.
   - `staging`: Builds `com.oneag.app.staging`, connects to staging API, release-optimized with R8.
   - `prod`: Builds `com.oneag.app`, connects to production API, full R8 obfuscation and resource shrinking.

4. **Signing Credentials**:
   - Debug signing keys are generated locally for development.
   - Release signing keys (Keystore/JKS for Android, Apple Distribution Certificates for iOS) are injected as base64-encoded environment variables at CI build time only.
