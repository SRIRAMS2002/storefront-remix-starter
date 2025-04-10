import { RegisterCustomerAccountMutationVariables } from '~/generated/graphql';

const EMAIL_REGEX = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;

export type RegisterValidationErrors = {
  form?: string;
  email?: string;
  password?: string;
  repeatPassword?: string;
};

export const validateRegistrationForm = (
  formData: FormData,
): RegisterValidationErrors => {
  const errors: RegisterValidationErrors = {};

  const email = formData.get('email');
  const password = formData.get('password');
  const repeatPassword = formData.get('repeatPassword');

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    errors.email = 'A valid e-mail address is required.';
  }

  if (typeof password !== 'string' || password.length < 4) {
    errors.password = 'Minimum password length is 4 symbols.';
  }

  if (typeof repeatPassword !== 'string') {
    errors.repeatPassword = 'Please repeat your password.';
  } else if (password !== repeatPassword) {
    errors.repeatPassword = 'Passwords do not match!';
  }

  return errors;
};


export const extractRegistrationFormValues = (
  formData: FormData,
): RegisterCustomerAccountMutationVariables => {
  return {
    input: {
      emailAddress: formData.get('email') as string,
      firstName: (formData.get('firstName') as string) || '',
      lastName: (formData.get('lastName') as string) || '',
      password: formData.get('password') as string,
    },
  };
};

