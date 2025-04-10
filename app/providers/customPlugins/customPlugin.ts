import gql from 'graphql-tag';
import { GetChannelListQuery, GetChannelsByCustomerEmailQuery,
    GetChannelsByCustomerEmailQueryVariables, } from '~/generated/graphql';
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





