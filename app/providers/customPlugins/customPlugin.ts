import gql from 'graphql-tag';
import { GetChannelListQuery } from '~/generated/graphql';
import { QueryOptions, sdk, WithHeaders } from '~/graphqlWrapper';

export async function getChannelList(p0: { request: Request; }): Promise<WithHeaders<GetChannelListQuery['getChannelList']>> {
    return sdk.getChannelList().then((res) => {
      const data = res.getChannelList;
      const result = Object.assign([...data], { _headers: res._headers });
      return result;
    });
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



