# LockGrid 🔐

LockGrid is a secure cloud storage platform that allows users to store and share data securely using pattern-based encryption.

The main idea is to simplify the process of sharing data—such as short texts and small files (up to 500KB)—from one device (like your phone) to another (like your laptop) without having to store them in your Google Drive permanently or having to email them to yourself.

## 🚀 How it Works

Instead of traditional passwords, LockGrid uses an intuitive 4x4 Android-style lock screen grid! 

1. **Store Data**: Draw a pattern (minimum 6 dots). This pattern acts as your encryption key. Your data is encrypted locally *before* it even leaves your device. The system gives you a short Unique Code (e.g., `8631`).
2. **View Data**: On any other device, go to LockGrid, draw the **exact same pattern**, and enter the Unique Code. Your data is fetched, decrypted, and displayed securely.

Because your pattern is the encryption key, if you forget your pattern, the data is impossible to recover. 

## 🛠️ Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Firebase Admin SDK (Firestore)](https://firebase.google.com/docs/firestore)
- **Rate Limiting**: [Upstash Redis](https://upstash.com/)
- **Deployment**: [Vercel](https://vercel.com/)

## ⚙️ Local Development Setup

To run this project locally, you will need Node.js and npm installed.

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory based on `.env.example`:
   ```env
   # Your stringified Firebase Service Account JSON
   FIREBASE_JSON={"type":"service_account",...}
   
   # Upstash Redis for rate limiting (max 5 requests/min)
   UPSTASH_REDIS_REST_URL=https://your-upstash-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-upstash-token
   
   # Random secure string for the Vercel cron job cleanup
   CRON_SECRET=your_secure_random_string
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ☁️ Deployment (Vercel)

LockGrid is optimized for Vercel deployment. 

1. Connect your GitHub repository to a new Vercel project.
2. In the Vercel Dashboard, go to **Settings > Environment Variables**.
3. Add `FIREBASE_JSON`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `CRON_SECRET`.
4. Deploy! The included `vercel.json` will automatically configure a cron job (`/api/cron`) that runs daily to clean up expired data.

## ⚠️ Security Notes
- Rate limiting is strictly enforced (5 requests per 60 seconds) to prevent brute-force attacks on your Redis & Firestore instances.
- Data is encrypted via `AES-GCM` using the `PBKDF2` derived key on the client side. The server never sees the plaintext data or the raw pattern.