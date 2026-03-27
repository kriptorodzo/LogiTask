import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import axios from 'axios';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || '',
      authorization: {
        params: {
          scope: 'openid profile email User.Read Mail.Read',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        // Store access token for API calls
        token.accessToken = account.access_token;
        token.role = (user as any)?.role || 'RECEPTION_COORDINATOR';
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).role = token.role;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
};

// Create axios instance with auth header
export const apiClient = axios.create({
  baseURL: backendUrl,
});

apiClient.interceptors.request.use((config) => {
  const token = (globalThis as any).__nextAuthOverride?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});