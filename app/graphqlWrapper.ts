import { DocumentNode, print } from 'graphql';
import { API_URL } from './constants';
import { getSdk } from './generated/graphql';
import { getSessionStorage } from './sessions';
// import { getSessionStorage } from './sessions';

export interface QueryOptions {
  request?: Request;
  headers?: Headers;
  customHeaders?: Record<string, string>;
}

export interface GraphqlResponse<Response> {
  errors: any[];
  data: Response;
}

export type WithHeaders<T> = T & { _headers: Headers };

const AUTH_TOKEN_SESSION_KEY = 'authToken';
const CHANNEL_TOKEN_SESSION_KEY = 'channelToken';

// ✅ Central function to send GraphQL queries/mutations
// async function sendQuery<Response, Variables = {}>(options: {
//   query: string;
//   variables?: Variables;
//   headers?: Headers;
//   request?: Request;
//   customHeaders?: Record<string, string>;
// }): Promise<GraphqlResponse<Response> & { headers: Headers }> {
//   const headers = new Headers(options.headers);

//   // ✅ Add customHeaders with priority
//   if (options.customHeaders) {
//     for (const [key, value] of Object.entries(options.customHeaders)) {
//       headers.set(key, value);
//     }
//   }

//   const sessionStorage = await getSessionStorage();
//   const session = await sessionStorage.getSession(
//     options.request?.headers.get('Cookie')
//   );

//   // ✅ Only inject vendure-token from session if not already set
//   if (!headers.has('vendure-token')) {
//     const sessionChannelToken = session?.get(CHANNEL_TOKEN_SESSION_KEY);
//     if (sessionChannelToken) {
//       headers.set('vendure-token', sessionChannelToken);

//       console.log('The channel Token',sessionChannelToken);
//     }
//   }

//   const authToken = session?.get(AUTH_TOKEN_SESSION_KEY);
//   if (authToken) {
//     headers.set('Authorization', `Bearer ${authToken}`);
//     console.log('Authorization - Bearer ',authToken);

//   }

//   headers.set('Content-Type', 'application/json');

//   const res = await fetch(API_URL, {
//     method: 'POST',
//     headers,
//     body: JSON.stringify({
//       query: options.query,
//       variables: options.variables,
//     }),
//   });

//   const json = (await res.json()) as GraphqlResponse<Response>;
//   return {
//     ...json,
//     headers: res.headers,
//   };
// }

// // ✅ Requester that handles session-based tokens and returns headers
// function requester<R, V>(
//   doc: DocumentNode,
//   vars?: V,
//   options?: QueryOptions
// ): Promise<R & { _headers: Headers }> {
//   return sendQuery<R, V>({
//     query: print(doc),
//     variables: vars,
//     ...options,
//   }).then(async (response) => {
//     const vendureAuthToken = response.headers.get('vendure-auth-token');
//     const headers = new Headers();

//     const sessionStorage = await getSessionStorage();
//     const session = await sessionStorage.getSession(
//       options?.request?.headers.get('Cookie')
//     );
    

//     if (vendureAuthToken && session) {
//       // ✅ Store new auth token
//       session.set(AUTH_TOKEN_SESSION_KEY, vendureAuthToken);

//       // ✅ Save updated session cookie
//       const setCookie = await sessionStorage.commitSession(session);
//       headers.set('Set-Cookie', setCookie);
//     }

//     headers.set('x-vendure-api-url', API_URL);

//     if (response.errors?.length) {
//       console.error(
//         response.errors[0].extensions?.exception?.stacktrace?.join('\n') ??
//           response.errors
//       );
//       throw new Error(JSON.stringify(response.errors[0]));
//     }

//     return { ...response.data, _headers: headers };
//   });
// }


async function sendQuery<Response, Variables = {}>(options: {
  query: string;
  variables?: Variables;
  headers?: Headers;
  request?: Request;
  customHeaders?: Record<string, string>;
}): Promise<GraphqlResponse<Response> & { headers: Headers }> {
  const headers = new Headers(options.headers);

  // Load session only if needed
  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(
    options.request?.headers.get('Cookie')
  );

  // ✅ Priority: custom vendure-token > session vendure-token
  const customChannelToken = options.customHeaders?.['vendure-token'];
  const sessionChannelToken = session?.get(CHANNEL_TOKEN_SESSION_KEY);

  if (customChannelToken) {
    headers.set('vendure-token', customChannelToken);
  } else if (!headers.has('vendure-token') && sessionChannelToken) {
    headers.set('vendure-token', sessionChannelToken);
  }

  // ✅ Authorization token from session
  const authToken = session?.get(AUTH_TOKEN_SESSION_KEY);
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  headers.set('Content-Type', 'application/json');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: options.query,
      variables: options.variables,
    }),
  });

  const json = (await res.json()) as GraphqlResponse<Response>;
  return {
    ...json,
    headers: res.headers,
  };
}

function requester<R, V>(
  doc: DocumentNode,
  vars?: V,
  options?: QueryOptions
): Promise<R & { _headers: Headers }> {
  return sendQuery<R, V>({
    query: print(doc),
    variables: vars,
    ...options,
  }).then(async (response) => {
    const vendureAuthToken = response.headers.get('vendure-auth-token');
    const headers = new Headers();

    const sessionStorage = await getSessionStorage();
    const session = await sessionStorage.getSession(
      options?.request?.headers.get('Cookie')
    );

    if (vendureAuthToken && session) {
      session.set(AUTH_TOKEN_SESSION_KEY, vendureAuthToken);
      const setCookie = await sessionStorage.commitSession(session);
      headers.set('Set-Cookie', setCookie);
    }

    headers.set('x-vendure-api-url', API_URL);

    if (response.errors?.length) {
      console.error(
        response.errors[0].extensions?.exception?.stacktrace?.join('\n') ??
          response.errors
      );
      throw new Error(JSON.stringify(response.errors[0]));
    }

    return { ...response.data, _headers: headers };
  });
}


// ✅ Base SDK with wrapped requester
const baseSdk = getSdk<QueryOptions, unknown>(requester);

// ✅ Add types and headers to SDK functions
type Sdk = typeof baseSdk;
type SdkWithHeaders = {
  [K in keyof Sdk]: (
    ...args: Parameters<Sdk[K]>
  ) => Promise<Awaited<ReturnType<Sdk[K]>> & { _headers: Headers }>;
};

export const sdk: SdkWithHeaders = baseSdk as any;
