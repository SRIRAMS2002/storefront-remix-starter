import { Link, useFetcher, useSearchParams } from '@remix-run/react';
import { ActionFunctionArgs, json, redirect } from '@remix-run/server-runtime';
import { login } from '~/providers/account/account';
import { ErrorResult } from '~/generated/graphql';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { Button } from '~/components/Button';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { getChannelsByCustomerEmail } from '~/providers/customPlugins/customPlugin';

export async function action({ params, request }: ActionFunctionArgs) {
  const body = await request.formData();
  let email = body.get('email');
  const password = body.get('password');

  console.log('📥 Form Data:', { email, password });

  if (typeof email === 'string' && typeof password === 'string') {
    if (/^\d{10}$/.test(email)) {
      email = `${email}@kaikani.com`;
      console.log('📧 Converted phone to email:', email);
    }

    const rememberMe = !!body.get('rememberMe');
    const redirectTo = (body.get('redirectTo') || '/account') as string;

    console.log('🔍 Getting channels for:', email);

    const channels = await getChannelsByCustomerEmail(email);

    console.log('📦 Channels fetched:', channels);

    if (!channels || channels.length === 0) {
      console.log('❌ No channels found for:', email);
      return json(
        { message: 'No channel associated with this email.' },
        { status: 403 }
      );
    }

    const selectedChannelToken = channels[0].token;
    console.log('🎯 Using channel token:', selectedChannelToken);

    const result = await login(email, password, rememberMe, {
      request,
      customHeaders: {
        'vendure-token': selectedChannelToken,
      },
    });

    console.log('✅ Login result:', result);

    if (result.__typename === 'CurrentUser') {
      console.log('🎉 Login success! Redirecting to:', redirectTo);
      return redirect(redirectTo, { headers: result._headers });
    } else {
      console.log('🚫 Login failed:', result);
      return json(result, { status: 401 });
    }
  }

  console.log('⚠️ Invalid form submission');
  return json({ message: 'Invalid email or password' }, { status: 400 });
}




export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const login = useFetcher<ErrorResult>();
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl text-gray-900">
            {t('account.signInTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('common.or')}{' '}
            <Link
              to="/sign-up"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('account.register')}
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 rounded p-4 text-center text-sm">
              <p>{t('vendure.demoCredentials')}</p>
              <p>
                {t('account.emailAddress')}
                {': '}
                <span className="font-bold">test@vendure.io</span>
              </p>
              <p>
                {t('account.password')}: <span className="font-bold">test</span>
              </p>
            </div>
            <login.Form method="post">
              <fieldset disabled={login.state !== 'idle'} className="space-y-6">
                <input
                  type="hidden"
                  name="redirectTo"
                  value={searchParams.get('redirectTo') ?? undefined}
                />
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t('account.emailAddress')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="tel"
                      autoComplete="tel"
                      required
                      defaultValue="test@vendure.io"
                      placeholder={t('account.emailAddress')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:text-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t('account.password')}
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder={t('account.password')}
                      defaultValue="test"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:text-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                      defaultChecked
                    />
                    <label
                      htmlFor="rememberMe"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      {t('account.rememberMe')}
                    </label>
                  </div>

                  <div className="text-sm">
                    <a
                      href="#"
                      className="font-medium text-primary-600 hover:text-primary-500"
                    >
                      {t('account.forgotPassword')}
                    </a>
                  </div>
                </div>

                {login.data && login.state === 'idle' && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <XCircleIcon
                          className="h-5 w-5 text-red-400"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          {t('account.errorSignIn')}
                        </h3>
                        <p className="text-sm text-red-700 mt-2">
                          {login.data.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <span className="flex gap-4 items-center">
                      {login.state !== 'idle' && (
                        <ArrowPathIcon className="animate-spin h-5 w-5 text-gray-500" />
                      )}
                      {t('account.signIn')}
                    </span>
                  </Button>
                </div>
              </fieldset>
            </login.Form>
          </div>
        </div>
      </div>
    </>
  );
}
