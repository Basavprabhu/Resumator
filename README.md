This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Resumator - AI-Powered Resume Builder

An intelligent resume builder that uses Google Gemini AI to transform raw career information into professionally formatted resumes with multiple template options and robust PDF export capabilities.

## Features

- **AI-Powered Generation**: Uses Google Gemini to structure and format resume content
- **Multiple Templates**: Professional, Modern, and Creative templates
- **Robust PDF Export**: Three export methods for maximum compatibility
- **Firebase Authentication**: Secure user authentication with Google OAuth
- **Template Registry System**: Easily extensible template management
- **Production Ready**: Optimized for serverless deployment

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase project with Authentication enabled
- Google Gemini API key

### Installation

```bash
# Clone and install dependencies
npm install

# Install Chrome for PDF generation (if needed)
npm run setup

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# For production PDF export (optional)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## PDF Export Options

The application provides three PDF export methods for maximum compatibility:

1. **Print to PDF (Recommended)**: Uses browser's built-in PDF generation
2. **Client Export**: Generates PDF in browser using html2canvas + jsPDF
3. **Server Export**: Server-side PDF generation using Puppeteer (may not work in all serverless environments)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Note**: Server-side PDF export may not work on Vercel due to Puppeteer limitations in serverless environments. The client-side and print-to-PDF options will work reliably.

### Firebase Hosting

```bash
npm run build
npm run export
# Deploy static files to Firebase Hosting
```

### Other Platforms

For platforms that support Puppeteer:

```bash
# Install Chrome browser
npm run setup

# Build and start
npm run build
npm start
```

## Template System

The application uses a centralized template registry system (`pages/lib/templateRegistry.ts`) that makes it easy to:

- Add new templates
- Manage template metadata
- Handle template validation
- Provide template features and descriptions

### Adding New Templates

1. Create your template component in `pages/components/templates/`
2. Add it to the `TEMPLATE_REGISTRY` in `templateRegistry.ts`
3. The template will automatically appear in the UI

## Architecture Improvements

This version includes several architectural improvements:

- **Centralized Template Management**: All templates managed through a registry system
- **Robust Error Handling**: Better error messages and fallback options
- **Production-Ready PDF Export**: Multiple export methods with proper fallbacks
- **Print CSS Optimization**: Proper print styles for browser PDF generation
- **Serverless Compatibility**: Optimized for deployment on Vercel, Netlify, etc.

## API Routes

- `/api/generateResume` - AI-powered resume generation using Gemini
- `/api/exportResume` - Server-side PDF export (when available)
- `/api/hello` - Health check endpoint

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
