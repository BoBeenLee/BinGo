# BinGo - AI Recycling Assistant

BinGo is a Next.js application that uses Google Gemini AI to help users recycle effectively and check bulky waste fees.

## Features
- **AI Image Analysis**: Identify items and get recycling instructions.
- **Bulky Waste Fee Lookup**: Check estimated disposal fees for your region.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file and add your Gemini API key:
   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## Data Management
The application uses JSON data in `data/regions/` for fee information.
If you deployed to Vercel, ensure the `data` directory is included in the build or use a database for more persistent storage in the future.
*Current implementation reads directly from the filesystem, which works in Next.js Server Components/API routes if the files are traced correctly.*

## Deployment
This project is ready for deployment on Vercel.
1. Push to GitHub.
2. Import project in Vercel.
3. Add `NEXT_PUBLIC_GEMINI_API_KEY` to Vercel Environment Variables.
