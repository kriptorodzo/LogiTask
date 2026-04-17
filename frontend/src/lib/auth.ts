import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

// Production/Pilot: MUST use Azure AD auth - no dev fallback allowed
// Only activates when BOTH NODE_ENV=production AND (no AUTH_MODE or AUTH_MODE=production)
// AND we're not in build time (BUILD_TIME env prevents check during next build)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
const isProductionMode = !isBuildTime && 
  process.env.NODE_ENV === 'production' && 
  (!process.env.AUTH_MODE || process.env.AUTH_MODE === 'production');

// In PRODUCTION mode: Azure AD MUST be configured with real values
// In DEVELOPMENT mode: placeholder credentials are OK (dev bypass used)
if (isProductionMode) {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  if (!clientId || clientId === 'placeholder' || clientId === 'REPLACE_WITH_ACTUAL_CLIENT_ID') {
    throw new Error('CRITICAL: Azure AD configuration missing in production. Set AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID with real values');
  }
  if (!process.env.AZURE_AD_CLIENT_SECRET || !process.env.AZURE_AD_TENANT_ID) {
    throw new Error('CRITICAL: Azure AD configuration incomplete. Set all three credentials');
  }
}

// Dev bypass provider for local UI testing
const devProvider = CredentialsProvider({
  name: 'Dev Credentials',
  credentials: {
    email: { label: "Email", type: "text" },
    role: { label: "Role", type: "text" }
  },
  async authorize(credentials) {
    return {
      id: 'dev-user-id',
      email: credentials?.email || 'dev@company.com',
      name: credentials?.email?.split('@')[0] || 'Dev User',
      role: credentials?.role || 'MANAGER',
    };
  }
});

// Azure AD provider - will use real or placeholder depending on mode
const azureProvider = AzureADProvider({
  clientId: process.env.AZURE_AD_CLIENT_ID || 'placeholder',
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET || 'placeholder',
  tenantId: process.env.AZURE_AD_TENANT_ID || 'placeholder',
  authorization: {
    params: {
      scope: 'openid profile email User.Read Mail.Read',
    },
  },
});

// Use dev bypass in development, Azure AD in production
const providers = isProductionMode ? [azureProvider] : [devProvider, azureProvider];

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        // Store access token for API calls
        token.accessToken = account.access_token || 'dev-bypass-token';
        token.role = (user as any)?.role || 
                     (account.provider === 'credentials' ? 'MANAGER' : 'RECEPTION_COORDINATOR');
      } else if (!token.accessToken) {
        // Ensure token exists for dev mode
        token.accessToken = 'dev-bypass-token';
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      // Put role at both session level AND user level for compatibility
      (session as any).role = token.role;
      if (session.user) {
        (session.user as any).role = token.role;
      }
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