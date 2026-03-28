import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

// Auto-detect dev mode: use Credentials if Azure AD is not configured
const isAzureConfigured = !!process.env.AZURE_AD_CLIENT_ID && !!process.env.AZURE_AD_CLIENT_SECRET && !!process.env.AZURE_AD_TENANT_ID;

const providers = !isAzureConfigured
  ? [
      CredentialsProvider({
        name: 'Dev Login',
        credentials: {
          email: { label: 'Email', type: 'email', placeholder: 'manager@company.com' },
          role: { label: 'Role', type: 'text', placeholder: 'MANAGER' },
        },
        async authorize(credentials) {
          // Dev mode: call backend to create/validate user
          try {
            const response = await fetch(`${backendUrl}/auth/dev-login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: credentials?.email, role: credentials?.role }),
            });
            if (response.ok) {
              const user = await response.json();
              return { ...user, name: user.displayName };
            }
          } catch (e) {
            console.error('Dev login error:', e);
          }
          // Fallback to mock user
          const email = credentials?.email || '';
          const role = credentials?.role || 'MANAGER';
          return { email, name: email.split('@')[0], role, id: email };
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