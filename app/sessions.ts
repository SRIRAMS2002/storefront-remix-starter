import {
  IS_CF_PAGES,
  safeRequireNodeDependency,
} from '~/utils/platform-adapter';
import { SessionStorage } from '@remix-run/server-runtime/dist/sessions';
import { ErrorResult } from '~/generated/graphql';
import { createCookieSessionStorage } from '@remix-run/cloudflare';
import { CreateCookieSessionStorageFunction, redirect } from '@remix-run/server-runtime';

async function getCookieSessionStorageFactory(): Promise<CreateCookieSessionStorageFunction> {
  if (IS_CF_PAGES) {
    return createCookieSessionStorage;
  } else {
    return safeRequireNodeDependency('@remix-run/node').then(
      (module) => module.createCookieSessionStorage,
    );
  }
}
let sessionStorage: SessionStorage<
  { activeOrderError: ErrorResult } & Record<string, any>
>;

export async function getSessionStorage() {
  if (sessionStorage) {
    return sessionStorage;
  }
  const factory = await getCookieSessionStorageFactory();
  sessionStorage = factory({
    cookie: {
      // name: 'vendure_remix_session',
      // httpOnly: true,
      // path: '/',
      // sameSite: 'lax',
      // secrets: ['awdbhbjahdbaw'],

        name: 'vendureSession', // ✅ must match what Vendure is setting or what you're using
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secrets: ['your-secret'],
        secure: process.env.NODE_ENV === 'production',
    },
  });
  return sessionStorage;
}




// export async function clearSession() {
//   const session = await getSessionStorage();
  
//   // Clear all session data
//   session.set('vendureSession', undefined);

//   // Return a redirect to login with cleared session
//   return redirect('/login', {
//     headers: {
//       'Set-Cookie': await session.commit(), // This should commit the updated session
//     },
//   });
// }