# Railway Environment Variables Setup

To deploy your application successfully, you need to set up the following environment variables in your Railway project:

1. Go to your Railway project dashboard
2. Click on your project
3. Go to the "Variables" tab
4. Add the following variables:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://your-mongodb-uri

# JWT
JWT_SECRET=your-jwt-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-app-url/api/auth/google/callback

# App URL
NEXT_PUBLIC_APP_URL=https://your-app-url

# Email (Brevo)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-email
BREVO_SMTP_PASS=your-brevo-api-key
```

Replace the placeholder values with your actual credentials:

1. `MONGODB_URI`: Your MongoDB connection string
2. `JWT_SECRET`: A secure random string for JWT token generation
3. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: From your Google Cloud Console
4. `GOOGLE_REDIRECT_URI`: Your app's callback URL (use your Railway app URL)
5. `NEXT_PUBLIC_APP_URL`: Your Railway app URL
6. `BREVO_SMTP_*`: Your Brevo SMTP credentials

After setting these variables:
1. Go to the "Deployments" tab
2. Click "Deploy Now" to trigger a new deployment

The build should now complete successfully with all required environment variables available. 