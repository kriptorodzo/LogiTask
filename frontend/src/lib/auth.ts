import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
const skipAuth = process.env.SKIP_AUTH === 'true';

// Dev mode: allow bypass of Azure AD authentication
const providers = skipAuth
  ? [
      CredentialsProvider({
        name: 'Dev Login',
        credentials: {
          email: { label: 'Email', type: 'email', placeholder: 'manager@company.com' },
          role: { label: 'Role', type: 'text', placeholder: 'MANAGER' },
        },
        async authorize(credentials) {
          // Dev mode: return mock user based on email
          const email = credentials?.email || '';
          const role = credentials?.role || 'MANAGER';
          
          const devUsers: Record<string, { email: string; name: string; role: string }> = {
            'manager@company.com': { email: 'manager@company.com', name: 'Dev Manager', role: 'MANAGER' },
            'reception@company.com': { email: 'reception@company.com', name: 'Reception Coord', role: 'RECEPTION_COORDINATOR' },
            'delivery@company.com': { email: 'delivery@company.com', name: 'Delivery Coord', role: 'DELIVERY_COORDINATOR' },
            'distribution@company.com': { email: 'distribution@company.com', name: 'Distribution Coord', role: 'DISTRIBUTION_COORDINATOR' },
          };
          
          const user = devUsers[email.toLowerCase()] || { email, name: 'Dev User', role };
          return { ...user, id: email };
        },
      }),
    ]
  : [
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
    ];

export const authOptions: NextAuthOptions = {
  providers,
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