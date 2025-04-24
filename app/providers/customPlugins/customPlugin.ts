import gql from 'graphql-tag';
import { GetChannelListQuery, GetChannelsByCustomerEmailQuery,
    GetChannelsByCustomerEmailQueryVariables,GetPasswordResetTokenQuery,RequestPasswordResetMutation, RequestPasswordResetMutationVariables,ResetPasswordMutation, SendPhoneOtpMutation, SendPhoneOtpMutationVariables,} from '~/generated/graphql';
import { QueryOptions, sdk, WithHeaders } from '~/graphqlWrapper';

export async function getChannelList(p0: { request: Request; }): Promise<WithHeaders<GetChannelListQuery['getChannelList']>> {
    return sdk.getChannelList().then((res) => {
      const data = res.getChannelList;

      
      const result = Object.assign([...data], { _headers: res._headers });
      return result;
    });
  }

  export async function getChannelsByCustomerEmail(
    email: string
  ): Promise<WithHeaders<GetChannelsByCustomerEmailQuery['getChannelsByCustomerEmail']>> {
    const response = await sdk.GetChannelsByCustomerEmail({ email }); // 👈 lowercase "g"
    const result = Object.assign([...response.getChannelsByCustomerEmail], {
      _headers: response._headers,
    });
    return result;
  }

  
  export async function getPasswordResetToken(email: string, p0: { request: Request; customHeaders: { 'vendure-token': string; }; }): Promise<WithHeaders<string>> {
    // Create a Headers instance and append the custom header
    const headers = new Headers();
    headers.append('vendure-token', p0.customHeaders['vendure-token']);
  
    // Pass the headers instance inside the QueryOptions
    const queryOptions: QueryOptions = {
      headers: headers,  // Pass the Headers object
    };
  
    return sdk.GetPasswordResetToken({}, queryOptions).then((res) => {
      const result = Object.assign(res.getPasswordResetToken, {
        _headers: res._headers,
      });
      return result;
    });
  }
  
  
  
  
  export async function requestPasswordReset(
    email: string
  ): Promise<WithHeaders<RequestPasswordResetMutation['requestPasswordReset']>> {
    const response = await sdk.RequestPasswordReset({ email });
    const { requestPasswordReset, _headers } = response;
  
    if (!requestPasswordReset) {
      // If it's null or undefined, return it with headers but explicitly typed
      return {
        __typename: 'NativeAuthStrategyError', // or some fallback typename if your schema expects it
        _headers,
      } as WithHeaders<RequestPasswordResetMutation['requestPasswordReset']>;
    }
  
    return {
      ...requestPasswordReset,
      _headers,
    };
  }



  export async function resetPassword(
token: string, password: string, p0: { request: Request; customHeaders: { 'vendure-token': string; }; }  ): Promise<WithHeaders<any>> {
    const response = await sdk.ResetPassword({
      token,
      password,
    });
  
    const { resetPassword, _headers } = response;
  
    if (!resetPassword) {
      return {
        __typename: 'PasswordResetTokenInvalidError',
        _headers,
      };
    }
  
    return {
      ...resetPassword,
      _headers,
    };
  }
  
  export async function sendPhoneOtp(
    phoneNumber: string
  ): Promise<boolean> {
    const response = await sdk.SendPhoneOtp({
      phoneNumber,
    });
  
    return response.sendPhoneOtp ?? false;
  }
  
  

gql`
 query getChannelList{
  getChannelList {
    id
    token
    code
  }
 }
`;

gql`
query GetChannelsByCustomerEmail($email: String!) {
    getChannelsByCustomerEmail(email: $email) {
      id
      code
      token
      defaultCurrencyCode
    }
  }
    `;

    gql`
    query GetPasswordResetToken {
      getPasswordResetToken
    }
  `;

 
gql`
mutation RequestPasswordReset($email: String!){
    requestPasswordReset(emailAddress: $email){
        __typename
    }
}

`;

gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      ... on CurrentUser {
        id
        channels {
          token
          code
          permissions
        }
      }
      ...ErrorResult
      __typename
    }
  }

  fragment ErrorResult on ErrorResult {
    errorCode
    message
    __typename
}
`;

gql`
  mutation SendPhoneOtp($phoneNumber: String!) {
    sendPhoneOtp(phoneNumber: $phoneNumber)
  }
`;