# Contact Form Email Setup Guide

## Current Setup
The contact form currently uses a `mailto:` link, which opens the user's email client. This works but requires users to have email configured.

## Better Option: EmailJS Setup

### Step 1: Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for a free account (200 emails/month free)

### Step 2: Add Email Service
1. Go to "Email Services" in the dashboard
2. Click "Add New Service"
3. Choose your email provider (Gmail recommended)
4. Follow the setup instructions
5. Note your **Service ID** (e.g., `service_xxxxx`)

### Step 3: Create Email Template
1. Go to "Email Templates" → "Create New Template"
2. Use this template:
   ```
   Subject: Contact Form Message from {{name}}
   
   From: {{name}}
   Email: {{email}}
   
   Message:
   {{message}}
   ```
3. Set "To Email" to your email: `bruceche@andrew.cmu.edu`
4. Note your **Template ID** (e.g., `template_xxxxx`)

### Step 4: Get Public Key
1. Go to "Account" → "General"
2. Copy your **Public Key** (e.g., `xxxxxxxxxxxxx`)

### Step 5: Update the Code
1. Open `script.js`
2. Find the EmailJS section (around line 115)
3. Replace these values:
   - `YOUR_PUBLIC_KEY` → Your Public Key
   - `YOUR_SERVICE_ID` → Your Service ID
   - `YOUR_TEMPLATE_ID` → Your Template ID
4. Uncomment the EmailJS code block (remove `/*` and `*/`)
5. Comment out or remove the mailto fallback code

### Step 6: Test
1. Submit the form on your website
2. Check your email inbox
3. You should receive the message!

## Alternative: Formspree

### Quick Setup:
1. Go to https://formspree.io/
2. Sign up for free account
3. Create a new form
4. Get your form endpoint (e.g., `https://formspree.io/f/xxxxx`)
5. Update the form in `index.html`:
   ```html
   <form id="contactForm" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```
6. Remove the JavaScript form handler (or keep it for validation)

## Alternative: Netlify Forms (if using Netlify)

If you deploy to Netlify:
1. Add `netlify` attribute to form: `<form netlify>`
2. Netlify automatically handles form submissions
3. View submissions in Netlify dashboard

---

**Need help?** The current mailto solution works immediately, but EmailJS provides a better user experience.

