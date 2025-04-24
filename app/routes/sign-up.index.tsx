import {
  Form,
  Link,
  useActionData,
  useSearchParams,
  useLoaderData,
  useNavigation,
  useFetcher,
} from '@remix-run/react';
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/server-runtime';
import { authenticate } from '~/providers/account/account';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import {
  getChannelList,
  sendPhoneOtp,
} from '~/providers/customPlugins/customPlugin';
import { getSessionStorage } from '~/sessions';
import { useState } from 'react';

interface RegisterValidationErrors {
  phoneNumber?: string;
  form?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const channels = await getChannelList({ request });
  return json({ channels });
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const intent = body.get('intent')?.toString();
  const phoneNumber = body.get('phoneNumber')?.toString();
  const code = body.get('otp')?.toString();
  const selectedChannelToken = body.get('channel')?.toString();
  const firstName = body.get('firstName')?.toString();
  const lastName = body.get('lastName')?.toString();
  const redirectTo = (body.get('redirectTo') || '/account') as string;


  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));

  if (selectedChannelToken) {
    session.set('channelToken', selectedChannelToken);
  }

  if (intent === 'send-otp' && phoneNumber) {
    const otpSent = await sendPhoneOtp(phoneNumber);
    return json(
      otpSent ? { otpSent: true } : { form: 'Failed to send OTP' },
      {
        headers: {
          'Set-Cookie': await sessionStorage.commitSession(session),
        },
      }
    );
  }

  if (intent === 'submit-form') {
    if (!phoneNumber || !code) {
      return json<RegisterValidationErrors>(
        { form: 'Phone number and OTP are required' },
        {
          status: 400,
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
          },
        }
      );
    }

    try {
      const { result ,headers} = await authenticate(
        {
          phoneOtp: {
            phoneNumber,
            code,
            firstName,
            lastName,
          },
        },
        {
          request,
          customHeaders: {
            'vendure-token': selectedChannelToken ?? '',
          },
        }
      );
      const vendureToken = headers.get('vendure-auth-token'); // ✅ CORRECT

      if ('__typename' in result && result.__typename === 'CurrentUser') {
        
        
        if (vendureToken) {
          session.set('authToken', vendureToken);
        }
      
        return redirect(redirectTo, {
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
          },
        });
      } else {
        return json<RegisterValidationErrors>(
          { form: 'Authentication failed' },
          {
            status: 401,
            headers: {
              'Set-Cookie': await sessionStorage.commitSession(session),
            },
          }
        );
      }
    } catch (error: any) {
      return json<RegisterValidationErrors>(
        { form: error.message || 'Unexpected error' },
        {
          status: 500,
          headers: {
            'Set-Cookie': await sessionStorage.commitSession(session),
          },
        }
      );
    }
  }

  return json(
    { form: 'Invalid request' },
    {
      status: 400,
      headers: {
        'Set-Cookie': await sessionStorage.commitSession(session),
      },
    }
  );
}

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const formErrors = useActionData<RegisterValidationErrors>();
  const { t } = useTranslation();
  const { channels } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [phoneInput, setPhoneInput] = useState('');
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  

  interface SendOtpResponse {
    otpSent?: boolean;
    form?: string;
  }

  const fetcher = useFetcher<SendOtpResponse>();
  const otpSent = fetcher.data?.otpSent;

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl text-gray-900">{t('account.create')}</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('common.or')}{' '}
          <Link to="/sign-in" className="font-medium text-primary-600 hover:text-primary-500">
            {t('account.login')}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

          {/* OTP Send Form */}
          <fetcher.Form method="post" className="space-y-6">
            <input type="hidden" name="intent" value="send-otp" />
            <label className="block text-sm font-medium text-gray-700">{t('account.phoneNumber')}</label>
            <div className="flex space-x-2">
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="text"
                required
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 text-sm text-white bg-primary-600 rounded-md"
                disabled={fetcher.state !== 'idle'}
              >
                {fetcher.state === 'submitting' ? 'Sending…' : t('sendOtp')}
              </button>
            </div>
            {formErrors?.phoneNumber && (
              <div className="text-xs text-red-700">{formErrors.phoneNumber}</div>
            )}
            {fetcher.data?.form && (
              <div className="text-xs text-red-700">{fetcher.data.form}</div>
            )}
            {otpSent && (
              <div className="text-green-600 text-sm">{t('otpSentSuccessfully')}</div>
            )}
          </fetcher.Form>

          {/* Registration Form */}
          <Form method="post" className="space-y-6 mt-6">
            <input type="hidden" name="intent" value="submit-form" />
            <input type="hidden" name="phoneNumber" value={phoneInput} />

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">{t('account.otp')}</label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={firstNameInput}
                onChange={(e) => setFirstNameInput(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                value={lastNameInput}
                onChange={(e) => setLastNameInput(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
              />
              
              
            </div>

            <div>
              <label htmlFor="channel" className="block text-sm font-medium text-gray-700">{t('account.channel')}</label>
              <select
                id="channel"
                name="channel"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"
                required
              >
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.token}>
                    {channel.code}
                  </option>
                ))}
              </select>
            </div>

            {formErrors?.form && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{t('account.createError')}</h3>
                    <p className="text-sm text-red-700 mt-2">{formErrors.form}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600"
              disabled={navigation.state === 'submitting'}
            >
              {t('account.signUp')}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
