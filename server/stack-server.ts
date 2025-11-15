import { StackServerApp } from '@stackframe/js';

if (!process.env.STACK_PROJECT_ID || !process.env.STACK_API_KEY) {
  throw new Error('STACK_PROJECT_ID and STACK_API_KEY must be set in environment variables');
}

export const stackServerApp = new StackServerApp({
  tokenStore: 'cookie',
  urls: {
    signIn: '/handler/sign-in',
    signUp: '/handler/sign-up',
    afterSignOut: '/handler/sign-in',
    oauthCallback: '/handler/oauth-callback',
  },
});

