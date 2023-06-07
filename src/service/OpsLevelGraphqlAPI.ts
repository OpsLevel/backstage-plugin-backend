import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { GraphQLClient, gql, ClientError } from 'graphql-request';
import { RateLimiter } from 'limiter';


// API Token Request Limit: No more than 250 API requests per minute per API token
// https://docs.opslevel.com/docs/graphql#what-is-the-api-rate-limit
const MAX_RPM = 249;

export const IMPORT_ENTITY_QUERY = gql`
mutation importEntityFromBackstage($entityRef: String!, $entity: JSON!) {
  importEntityFromBackstage(entityRef: $entityRef, entity: $entity) {
    errors {
      message
    }
    actionMessage
    htmlUrl
  }
}
`;

export type ExportEntityResponse = {
  importEntityFromBackstage: {
    errors: Array<{ message: string }>,
    actionMessage: string,
  }
}

export class OpsLevelGraphqlAPI {
  private client: GraphQLClient;
  private limiter: RateLimiter;

  constructor(backendUrl: string, client: GraphQLClient | null = null) {
    this.client = client || new GraphQLClient(`${backendUrl}/api/proxy/opslevel/graphql`, { headers: { "GraphQL-Visibility": "internal" } });
    this.limiter = new RateLimiter({ tokensPerInterval: MAX_RPM, interval: "minute" });
  }

  public async exportEntity(entity: Entity): Promise<ExportEntityResponse> {
    const entityRef = stringifyEntityRef(entity);
    return (this.request(IMPORT_ENTITY_QUERY, { entityRef, entity }) as Promise<ExportEntityResponse>);
  }

  private async request<T>(query: string, args: any, retries=3): Promise<T> {
    await this.limiter.removeTokens(1);
    try {
      return await this.client.request<T>(query, args);
    } catch (error) {
      if(error instanceof ClientError && error.response?.status === 429 && retries > 0) {
        await new Promise(r => setTimeout(r, (3-retries+1) * 10000));
        return this.request(query, args, retries-1);
      }
      throw error;
    }
  }
}
