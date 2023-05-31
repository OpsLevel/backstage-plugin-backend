import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { GraphQLClient, gql } from 'graphql-request';

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

  constructor(backendUrl: string, client: GraphQLClient | null = null) {
    this.client = client || new GraphQLClient(`${backendUrl}/api/proxy/opslevel/graphql`, { headers: { "GraphQL-Visibility": "internal" } });
  }

  public async exportEntity(entity: Entity): Promise<ExportEntityResponse> {
    const entityRef = stringifyEntityRef(entity);
    return (this.client.request(IMPORT_ENTITY_QUERY, { entityRef, entity }) as Promise<ExportEntityResponse>);
  }
}
