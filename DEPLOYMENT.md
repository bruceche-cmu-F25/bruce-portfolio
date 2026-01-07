# Deployment Instructions

This website is deployed to GitHub Pages with a custom domain: https://www.bruceche.com/

## Setup Instructions

### 1. Configure GitHub Pages
1. Go to your repository settings on GitHub
2. Navigate to "Pages" section
3. Set Source to "Deploy from a branch"
4. Select the branch you want to deploy (e.g., `main` or `copilot/build-personal-website`)
5. Select the root folder `/` as the source
6. Save the settings

### 2. Configure Custom Domain
1. In the same GitHub Pages settings, find the "Custom domain" section
2. Enter your domain: `www.bruceche.com`
3. Click "Save"
4. This will create a CNAME file in your repository

### 3. Configure DNS Settings
You need to configure your DNS settings with your domain registrar:

#### Option A: Using CNAME (Recommended for www subdomain)
Add a CNAME record:
- **Type**: CNAME
- **Name**: www
- **Value**: bruceche-cmu-f25.github.io
- **TTL**: 3600 (or your preferred value)

#### Option B: Using A Records (for apex domain)
If you want to use `bruceche.com` (without www), add these A records:
- **Type**: A
- **Name**: @ (or leave empty)
- **Value**: 185.199.108.153
- **Value**: 185.199.109.153
- **Value**: 185.199.110.153
- **Value**: 185.199.111.153

And add a CNAME record for www:
- **Type**: CNAME
- **Name**: www
- **Value**: bruceche-cmu-f25.github.io

### 4. Enable HTTPS (Recommended)
After DNS propagation (can take up to 24-48 hours):
1. Return to GitHub Pages settings
2. Check the "Enforce HTTPS" option
3. GitHub will automatically provision an SSL certificate

## Alternative Deployment Options

### Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set build settings (not needed for this static site)
3. Configure custom domain in Netlify dashboard
4. Update DNS settings as per Netlify's instructions

### Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Import the project
3. Configure custom domain in Vercel dashboard
4. Update DNS settings as per Vercel's instructions

### Deploy to Traditional Web Hosting
1. Build/download all files from the repository
2. Upload files via FTP/SFTP to your web hosting
3. Ensure index.html is in the root directory
4. Configure domain to point to your hosting server

## Verification
After DNS propagation, verify your deployment by:
1. Visiting http://www.bruceche.com/
2. Checking that HTTPS works (https://www.bruceche.com/)
3. Testing mobile responsiveness
4. Verifying all sections and links work

## Updating the Website
Simply push changes to your branch, and GitHub Pages will automatically redeploy.

## Troubleshooting
- **404 Error**: Ensure index.html is in the root directory
- **DNS not working**: DNS changes can take 24-48 hours to propagate
- **HTTPS not available**: Wait for DNS to propagate, then enable HTTPS in settings
- **Images not loading**: Check that image paths are correct and files exist
