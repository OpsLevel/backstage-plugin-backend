import { OpsLevelGraphqlAPI, IMPORT_ENTITY_QUERY } from '../service/OpsLevelGraphqlAPI';

describe('OpsLevelGraphqlAPI', () => {
  let opsLevelAPI: any;
  let client: any;

  beforeAll(async () => {
    client = {
      request: jest.fn(),
    }
    opsLevelAPI = new OpsLevelGraphqlAPI("http://example.com/api", client);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('exportEntity', () => {
    it('sets off a GQL query with the entity when everything is fine', async () => {
      const entity = { kind: "user", metadata: { name: "User 1" } };

      await opsLevelAPI.exportEntity(entity);

      expect(client.request).toHaveBeenCalledTimes(1);
      expect(client.request).toHaveBeenCalledWith(IMPORT_ENTITY_QUERY, { entity: entity, entityRef: "user:default/user 1" });
    });

    it('raises an error if the query failed', async () => {
      const entity = { kind: "user", metadata: { name: "User 1" } };
      client.request.mockImplementation(() => { throw Error("Could not connect!"); });

      await expect(opsLevelAPI.exportEntity(entity)).rejects.toThrow(Error("Could not connect!"));
    });
  });
});
