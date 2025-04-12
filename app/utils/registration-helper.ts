import { RegisterCustomerAccountMutationVariables } from '~/generated/graphql';
import dotenv from 'dotenv';
dotenv.config();

const EMAIL_REGEX = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;

export type RegisterValidationErrors = {
  form?: string;
  phoneNumber?: string;
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

  const phoneNumber = formData.get('phoneNumber')?.toString() || '';
  if (!phoneNumber || phoneNumber.trim() === '') {
    errors.phoneNumber = 'Phone number is required.';
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


export const extractRegistrationFormValues = (formData: FormData) => {
  const phoneNumber = formData.get('phoneNumber')?.toString() ?? '';
  const emailAddress = `${phoneNumber}@kaikani.com`;
  const password = formData.get('password')?.toString() ?? '';
  const firstName = formData.get('firstName')?.toString() ?? '';
  const lastName = formData.get('lastName')?.toString() ?? '';

  return {
    emailAddress,
    password,
    firstName,
    lastName,
    phoneNumber,
  };
};
