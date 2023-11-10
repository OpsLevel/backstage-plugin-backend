import { ClientError } from "graphql-request";
import {
  OpsLevelGraphqlAPI,
  IMPORT_ENTITY_QUERY,
} from "../service/OpsLevelGraphqlAPI";

describe("OpsLevelGraphqlAPI", () => {
  let opsLevelAPI: any;
  let client: any;

  beforeAll(async () => {
    client = {
      request: jest.fn(),
    };
    opsLevelAPI = new OpsLevelGraphqlAPI("http://example.com/api", client);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("exportEntity", () => {
    it("sets off a GQL query with the entity when everything is fine", async () => {
      const entity = { kind: "user", metadata: { name: "User 1" } };

      await opsLevelAPI.exportEntity(entity);

      expect(client.request).toHaveBeenCalledTimes(1);
      expect(client.request).toHaveBeenCalledWith(IMPORT_ENTITY_QUERY, {
        entity,
        entityRef: "user:default/user 1",
      });
    });

    it("raises an error if the query failed for a reason other than being rate limited", async () => {
      const entity = { kind: "user", metadata: { name: "User 1" } };
      client.request.mockImplementation(() => {
        throw Error("Could not connect!");
      });

      await expect(opsLevelAPI.exportEntity(entity)).rejects.toThrow(
        Error("Could not connect!"),
      );
    });

    it("retries thrice if we are getting rate limited, then gives up", async () => {
      const entity = { kind: "user", metadata: { name: "User 1" } };
      const error = new ClientError({ status: 429 }, { query: "" });
      client.request.mockImplementation(() => {
        throw error;
      });
      jest.spyOn(global, "setTimeout").mockImplementation((callback) => {
        callback();
        return null as any;
      });

      await expect(opsLevelAPI.exportEntity(entity)).rejects.toThrow(error);

      const mockedTimeout = setTimeout as jest.MockedFunction<
        typeof setTimeout
      >;
      expect(mockedTimeout).toHaveBeenCalledTimes(3);
      expect(mockedTimeout.mock.calls[0][1]).toEqual(20000);
      expect(mockedTimeout.mock.calls[1][1]).toEqual(40000);
      expect(mockedTimeout.mock.calls[2][1]).toEqual(60000);

      expect(client.request).toHaveBeenCalledTimes(4);
      for (let i = 1; i <= 4; i++) {
        expect(client.request).toHaveBeenNthCalledWith(i, IMPORT_ENTITY_QUERY, {
          entity,
          entityRef: "user:default/user 1",
        });
      }
    });

    it("retries thrice if we are getting rate limited, then succeeds on the last try", async () => {
      const entity = { kind: "user", metadata: { name: "User 1" } };
      const error = new ClientError({ status: 429 }, { query: "" });
      let n = 3;
      client.request.mockImplementation(() => {
        if (n-- > 0) {
          throw error;
        }
      });
      jest.spyOn(global, "setTimeout").mockImplementation((callback) => {
        callback();
        return null as any;
      });

      await opsLevelAPI.exportEntity(entity);

      const mockedTimeout = setTimeout as jest.MockedFunction<
        typeof setTimeout
      >;
      expect(mockedTimeout).toHaveBeenCalledTimes(3);
      expect(mockedTimeout.mock.calls[0][1]).toEqual(20000);
      expect(mockedTimeout.mock.calls[1][1]).toEqual(40000);
      expect(mockedTimeout.mock.calls[2][1]).toEqual(60000);

      expect(client.request).toHaveBeenCalledTimes(4);
      for (let i = 1; i <= 4; i++) {
        expect(client.request).toHaveBeenNthCalledWith(i, IMPORT_ENTITY_QUERY, {
          entity,
          entityRef: "user:default/user 1",
        });
      }
    });
  });
});
