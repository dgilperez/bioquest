export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/api/user/:path*', '/api/observations/:path*'],
};
