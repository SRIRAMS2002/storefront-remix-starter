import { Form, Link, useActionData, useSearchParams, useLoaderData } from '@remix-run/react';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/server-runtime';
import { registerCustomerAccount } from '~/providers/account/account';
import { XCircleIcon } from '@heroicons/react/24/solid';
import {
  extractRegistrationFormValues,
  RegisterValidationErrors,
  validateRegistrationForm,
} from '~/utils/registration-helper';
import { API_URL, DEMO_API_URL } from '~/constants';
import { useTranslation } from 'react-i18next';
import { getFixedT } from '~/i18next.server';
import { getChannelList } from '~/providers/customPlugins/customPlugin';
import { getSessionStorage } from '~/sessions';

export async function loader({ request }: LoaderFunctionArgs) {
  const channels = await getChannelList({ request });
  return json({ channels });
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const selectedChannelToken = body.get('channel')?.toString();

  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  
  if (selectedChannelToken) {
    session.set('channelToken', selectedChannelToken);
  }
  
  const fieldErrors = validateRegistrationForm(body);
  if (Object.keys(fieldErrors).length !== 0) {
    return fieldErrors;
  }
  
  const variables = extractRegistrationFormValues(body);
  
  // ✅ Pass selected channel token explicitly
  const result = await registerCustomerAccount(
    {
      request,
      customHeaders: {
        'vendure-token': selectedChannelToken ?? '',
      },
    },
    variables
  );
  
  if (result.__typename === 'Success') {
    return redirect('/sign-up/success', {
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  } else {
    const formError: RegisterValidationErrors = {
      form: result.errorCode,
    };
    return json(formError, {
      status: 401,
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    });
  }
  
}

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const formErrors = useActionData<RegisterValidationErrors>();
  const { t } = useTranslation();
  const { channels } = useLoaderData<typeof loader>();

  return (
    <>
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl text-gray-900">
            {t('account.create')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('common.or')}{' '}
            <Link
              to="/sign-in"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('account.login')}
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 rounded p-4 text-center text-sm">
              <p>{t('vendure.registrationMessage')}</p>
            </div>
            <Form className="space-y-6" method="post">
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
                    type="email"
                    autoComplete="email"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {formErrors?.email && (
                    <div className="text-xs text-red-700">
                      {formErrors.email}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('account.firstName')}
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('account.lastName')}
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="channel" className="block text-sm font-medium text-gray-700">
                  {t('account.channel')}
                </label>
                <div className="mt-1">
                  <select
                    id="channel"
                    name="channel"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.token}>
                        {channel.code}
                      </option>
                    ))}
                  </select>
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
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {formErrors?.password && (
                    <div className="text-xs text-red-700">
                      {formErrors.password}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="repeatPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('account.repeatPassword')}
                </label>
                <div className="mt-1">
                  <input
                    id="repeatPassword"
                    name="repeatPassword"
                    type="password"
                    autoComplete="current-password"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  {formErrors?.repeatPassword && (
                    <div className="text-xs text-red-700">
                      {formErrors.repeatPassword}
                    </div>
                  )}
                </div>
              </div>
              {formErrors?.form && (
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
                        {t('account.createError')}
                      </h3>
                      <p className="text-sm text-red-700 mt-2">
                        {formErrors.form}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('account.signUp')}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
