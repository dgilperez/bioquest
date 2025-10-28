import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';

// Check if we're in mock mode (when iNat credentials are not configured)
const isMockMode = !process.env.INATURALIST_CLIENT_ID || process.env.INATURALIST_CLIENT_ID === 'your_client_id_here';

export const authOptions: NextAuthOptions = {
  adapter: isMockMode ? undefined : PrismaAdapter(prisma),
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
          scope: 'read',
          response_type: 'code',
        },
      },
      token: 'https://www.inaturalist.org/oauth/token',
      userinfo: 'https://api.inaturalist.org/v1/users/me',
      clientId: process.env.INATURALIST_CLIENT_ID,
      clientSecret: process.env.INATURALIST_CLIENT_SECRET,
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
  pages: {
    signIn: '/signin',
    error: '/signin',  // Redirect errors back to sign-in
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in - need to get database user ID
      if (account && user) {
        // Look up the database user ID from inatId
        const dbUser = await prisma.user.findUnique({
          where: { inatId: (user as any).inatId },
          select: { id: true },
        });

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
          // Update user info
          await prisma.user.update({
            where: { inatId: (user as any).inatId },
            data: {
              name: user.name || (user as any).inatUsername,
              icon: user.image,
              email: user.email,
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
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
