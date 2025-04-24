import { Link, useFetcher } from '@remix-run/react';
import { ActionFunctionArgs, json, redirect } from '@remix-run/server-runtime';
import { Button } from '~/components/Button';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { getChannelsByCustomerEmail, sendPhoneOtp } from '~/providers/customPlugins/customPlugin';
import { authenticate } from '~/providers/account/account';
import { getSessionStorage } from '~/sessions';

// ✅ Hook to detect client (needed for disabling button before hydration)
function useIsClient() {
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const phoneNumber = body.get('phoneNumber') as string;
  const otp = body.get('otp') as string;
  const actionType = body.get('actionType') as string;
  // const firstName = body.get('firstName')?.toString();
  // const lastName = body.get('lastName')?.toString();

  const rememberMe = !!body.get('rememberMe');
  const redirectTo = (body.get('redirectTo') || '/account') as string;
  const sessionStorage = await getSessionStorage();
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));

  if (!phoneNumber || phoneNumber.length !== 10) {
    return json({ message: 'Invalid phone number' }, { status: 400 });
  }

  console.log('Incoming actionType:', actionType);
console.log('Phone Number:', phoneNumber);

  // Send OTP flow
  if (actionType === 'send-otp') {
    const sent = await sendPhoneOtp(phoneNumber);
    return json({ sent });
  }

  // Login (OTP verification) flow
  if (actionType === 'login' && otp) {
    const email = `${phoneNumber}@kaikani.com`;
    const channels = await getChannelsByCustomerEmail(email);

    console.log('Channels found:', channels);

    if (!channels || channels.length === 0) {
      return json({ message: 'No channel associated with this phone number.' }, { status: 403 });
    }

    const selectedChannelToken = channels[0].token;
    console.log('Using channel token:', selectedChannelToken);

    const result = await authenticate(
      {
        phoneOtp: {
          phoneNumber,
          code: otp,
          
        },
      },
      {
        request,
        customHeaders: { 'vendure-token': selectedChannelToken },
      }
    );
    
    if ('__typename' in result.result && result.result.__typename === 'CurrentUser') {
      const vendureToken = result.headers.get('vendure-auth-token');
    
      if (vendureToken) {
        session.set('authToken', vendureToken);
        session.set('rememberMe', rememberMe);
        const cookieHeaders = await sessionStorage.commitSession(session);
    
        return redirect(redirectTo, {
          headers: {
            'Set-Cookie': cookieHeaders,
          },
        });
      }
    }
    console.log('Auth result:', result.result);
    console.log('vendure-auth-token:', result.headers.get('vendure-auth-token'));
        

    return json({ message: 'Invalid credentials' }, { status: 401 });
  }

  return json({ message: 'Invalid request' }, { status: 400 });
}

export default function SignInPage() {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const isClient = useIsClient();

  const sendOtpFetcher = useFetcher();
  const loginFetcher = useFetcher();

  // Track OTP sent state
  React.useEffect(() => {
    if ((sendOtpFetcher.data as { sent?: boolean })?.sent) {
      setOtpSent(true);
    }
  }, [sendOtpFetcher.data]);

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl text-gray-900">{t('account.signInTitle')}</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('common.or')}{' '}
          <Link to="/sign-up" className="font-medium text-primary-600 hover:text-primary-500">
            {t('account.register')}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-6">

          {/* Send OTP Form */}
          {!otpSent && (
            <sendOtpFetcher.Form method="post" className="space-y-6">
              <input type="hidden" name="actionType" value="send-otp" />
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={!isClient || !phoneNumber || sendOtpFetcher.state !== 'idle'}
                  >
                    Send OTP
                  </Button>
                </div>
              </div>
            </sendOtpFetcher.Form>
          )}

          {/* Login Form */}
          {otpSent && (
            <loginFetcher.Form method="post" className="space-y-6">
              <input type="hidden" name="actionType" value="login" />
              <input type="hidden" name="phoneNumber" value={phoneNumber} />

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  OTP
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    placeholder="Enter OTP"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                RememberMe
                </label>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={loginFetcher.state !== 'idle'}
                  className="w-full"
                >
               signIn
                </Button>
              </div>
            </loginFetcher.Form>
          )}
        </div>
      </div>
    </div>
  );
}
