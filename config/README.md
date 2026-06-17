# Configuration Directory

This directory contains all configuration files for the project.

## 📋 Configuration Files

### Environment Configuration
- **`.env.example`** - Template for environment variables with all required settings
  - Copy this to `.env` and customize for your environment
  - Contains database, JWT, CORS, and feature flag settings

### Security Configuration
- **`.gitleaks.toml`** - Gitleaks configuration for preventing secret leaks
  - Configured with allowlist for documentation files
  - Helps prevent accidental commits of sensitive data

### TypeScript Configuration
- **`tsconfig.test.json`** - TypeScript configuration specifically for tests
  - Extends main tsconfig.json
  - Includes Vitest types and test-specific settings

## 🔧 Usage Instructions

### Setting Up Environment
1. Copy `.env.example` to `.env`:
   ```bash
   cp config/.env.example .env
   ```
2. Edit `.env` with your specific values:
   - Database connection details
   - JWT secret (use a strong 32+ character secret)
   - CORS allowed origins
   - Feature flags

### Security Scanning
The `.gitleaks.toml` file is used by Gitleaks to scan for secrets:
```bash
# Install gitleaks
# Scan the repository
gitleaks detect --config config/.gitleaks.toml
```

### Test Configuration
The `tsconfig.test.json` is automatically used by the test runner and extends the main TypeScript configuration with test-specific settings.

## ⚙️ Configuration Categories

### Database
- Host, port, credentials, and connection limits
- Supports MySQL/PostgreSQL

### Authentication
- JWT secrets and token expiration times
- Access and refresh token TTL settings

### CORS & Security
- Allowed origins for cross-origin requests
- Trust proxy settings for load balancers

### Features
- Commissioner server toggle
- Upload scanning capabilities
- Request logging controls

### Development
- Log levels and debugging options
- Rate limiting configuration
- Upload file size and type restrictions

## 🔒 Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** (32+ characters, random)
3. **Restrict CORS origins** in production
4. **Enable security features** like upload scanning in production
5. **Review gitleaks configuration** regularly

## 📝 Environment Variables Reference

### Required Variables
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`

### Optional Variables
- `NODE_ENV` (development/production)
- `PORT` (default: 3037)
- `CORS_ALLOWED_ORIGINS`
- Various feature flags and limits

---

**Last Updated**: November 11, 2025
