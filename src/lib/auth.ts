import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';

// Check if we're in mock mode (when iNat credentials are not configured)
const isMockMode = !process.env.INATURALIST_CLIENT_ID || process.env.INATURALIST_CLIENT_ID === 'your_client_id_here';

export const authOptions: NextAuthOptions = {
  // Don't use adapter with JWT sessions - we handle DB sync in signIn callback
  adapter: undefined,
  providers: [
    // Mock provider for development (when iNat OAuth not yet approved)
    ...(isMockMode ? [
      CredentialsProvider({
        id: 'mock',
        name: 'Mock User (Dev Mode)',
        credentials: {
          username: { label: "Username", type: "text", placeholder: "naturalist" }
        },
        async authorize(credentials) {
          // In mock mode, any username works
          const username = credentials?.username || 'test_naturalist';
          const mockUserId = 999999; // Mock iNat ID

          console.log('🎭 Mock auth - authorizing user:', username);

          const user = {
            id: mockUserId.toString(),
            name: `${username} (Mock)`,
            email: `${username}@mock.bioquest.dev`,
            image: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
            inatId: mockUserId,
            inatUsername: username,
          };

          console.log('🎭 Mock auth - returning user:', user);
          return user;
        },
      })
    ] : []),
    // Real iNaturalist OAuth provider
    ...(!isMockMode ? [{
      id: 'inaturalist',
      name: 'iNaturalist',
      type: 'oauth' as const,
      version: '2.0' as const,
      authorization: {
        url: 'https://www.inaturalist.org/oauth/authorize',
        params: {
          scope: 'write login',
          response_type: 'code',
        },
      },
      token: {
        url: 'https://www.inaturalist.org/oauth/token',
        async request(context: any) {
          const { provider, params } = context;

          console.log('🔑 Token exchange - requesting token with code:', params.code?.substring(0, 10) + '...');

          const response = await fetch(provider.token.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: provider.clientId,
              client_secret: provider.clientSecret,
              code: params.code,
              grant_type: 'authorization_code',
              redirect_uri: provider.callbackUrl,
            }),
          });

          const tokens = await response.json();
          console.log('🔑 Token exchange response:', {
            access_token: tokens.access_token?.substring(0, 20) + '...',
            token_type: tokens.token_type,
            scope: tokens.scope,
          });

          return { tokens };
        },
      },
      userinfo: {
        url: 'https://www.inaturalist.org/users/api_token',
        async request(context: any) {
          console.log('👤 Userinfo request - access_token:', context.tokens?.access_token?.substring(0, 20) + '...');

          // First, get the API token from iNaturalist
          const apiTokenResponse = await fetch('https://www.inaturalist.org/users/api_token', {
            headers: {
              Authorization: `Bearer ${context.tokens.access_token}`,
            },
          });

          console.log('👤 API Token response status:', apiTokenResponse.status);

          if (!apiTokenResponse.ok) {
            console.error('👤 Failed to get API token');
            return { error: 'Failed to get API token', status: apiTokenResponse.status };
          }

          const apiTokenData = await apiTokenResponse.json();
          console.log('👤 API Token data:', JSON.stringify(apiTokenData).substring(0, 200));

          // Now use the API token to get user info
          const userInfoResponse = await fetch('https://api.inaturalist.org/v1/users/me', {
            headers: {
              Authorization: `Bearer ${apiTokenData.api_token}`,
            },
          });

          const userData = await userInfoResponse.json();
          console.log('👤 User info response status:', userInfoResponse.status);
          console.log('👤 User info data:', JSON.stringify(userData).substring(0, 300));

          return userData;
        },
      },
      clientId: process.env.INATURALIST_CLIENT_ID,
      clientSecret: process.env.INATURALIST_CLIENT_SECRET,
      checks: [], // Disable state check - iNaturalist doesn't return state parameter
      profile(profile: any) {
        // iNaturalist API returns data in 'results' array
        const user = profile.results?.[0] || profile;
        return {
          id: user.id?.toString() || '',
          name: user.name || user.login,
          email: user.email || null,
          image: user.icon || user.icon_url || null,
          inatId: user.id,
          inatUsername: user.login,
        };
      },
    }] : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `${isMockMode ? 'next-auth.session-token.mock' : 'next-auth.session-token'}`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',  // Redirect errors back to sign-in
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in - need to get database user ID
      if (account && user) {
        // Look up the database user ID from inatId
        // Retry a few times in case user is being created concurrently
        let dbUser = null;
        for (let i = 0; i < 3; i++) {
          dbUser = await prisma.user.findUnique({
            where: { inatId: (user as any).inatId },
            select: { id: true },
          });
          if (dbUser) break;
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retry
        }

        if (!dbUser) {
          console.error('Failed to find user in database after sign in:', (user as any).inatId);
        }

        return {
          ...token,
          userId: dbUser?.id, // Store the database user ID
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          inatId: (user as any).inatId,
          inatUsername: (user as any).inatUsername,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // In mock mode, don't attempt to refresh (no real OAuth)
      if (isMockMode) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId; // Use database user ID
        (session.user as any).inatId = token.inatId;
        (session.user as any).inatUsername = token.inatUsername;
        (session as any).accessToken = token.accessToken;
        (session as any).error = token.error;
      }
      return session;
    },
    async signIn({ user, account }) {
      // In mock mode, credentials provider doesn't create account object
      if (isMockMode && !account) {
        // Still sync mock user to database
        try {
          const existingUser = await prisma.user.findUnique({
            where: { inatId: (user as any).inatId },
          });

          if (!existingUser) {
            await prisma.user.create({
              data: {
                inatId: (user as any).inatId,
                inatUsername: (user as any).inatUsername,
                name: user.name || (user as any).inatUsername,
                icon: user.image,
                email: user.email,
                stats: {
                  create: {
                    totalObservations: 0,
                    totalSpecies: 0,
                    totalPoints: 0,
                    level: 1,
                    pointsToNextLevel: 100,
                  },
                },
              },
            });
          }
          return true;
        } catch (error) {
          console.error('Error syncing mock user:', error);
          return false;
        }
      }

      if (!account) return false;

      // Sync user data with our database
      try {
        const existingUser = await prisma.user.findUnique({
          where: { inatId: (user as any).inatId },
        });

        if (!existingUser) {
          // Create user and initial stats
          await prisma.user.create({
            data: {
              inatId: (user as any).inatId,
              inatUsername: (user as any).inatUsername,
              name: user.name || (user as any).inatUsername,
              icon: user.image,
              email: user.email,
              accessToken: account.access_token, // Store access token for background processing
              stats: {
                create: {
                  totalObservations: 0,
                  totalSpecies: 0,
                  totalPoints: 0,
                  level: 1,
                  pointsToNextLevel: 100,
                },
              },
            },
          });
        } else {
          // Update user info and access token
          await prisma.user.update({
            where: { inatId: (user as any).inatId },
            data: {
              name: user.name || (user as any).inatUsername,
              icon: user.image,
              email: user.email,
              accessToken: account.access_token, // Update access token on each login
            },
          });
        }

        return true;
      } catch (error) {
        console.error('Error syncing user:', error);
        return false;
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

async function refreshAccessToken(token: any) {
  try {
    const url = 'https://www.inaturalist.org/oauth/token';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
        client_id: process.env.INATURALIST_CLIENT_ID || '',
        client_secret: process.env.INATURALIST_CLIENT_SECRET || '',
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    // Log minimal error info, not full stack trace
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.warn('Token refresh timeout - iNaturalist may be unreachable');
    } else if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.warn('Token refresh failed - network error');
    } else {
      console.warn('Token refresh failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
