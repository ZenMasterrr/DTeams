// Load environment variables from the root .env file
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_ZAP_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_ZAP_CONTRACT_ADDRESS,
    NEXT_PUBLIC_ORACLE_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_ORACLE_CONTRACT_ADDRESS,
  }
};

export default nextConfig;