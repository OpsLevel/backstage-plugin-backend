// import { OpsLevelBuilder } from '../service/OpsLevelBuilder';

// describe('OpsLevelBuilder', () => {
//   let opsLevelBuilder: any;

//   beforeAll(async () => {
//     builder = OpsLevelBuilder.create();
//   });

//   beforeEach(() => {
//     jest.resetAllMocks();
//   });

//   describe('creates an ', () => {
//     it('sets off a GQL query with the entity when everything is fine', async () => {
//       const entity = { kind: "user", "name": "User 1" };

//       opsLevelAPI.exportEntity(entity);

//       expect(client.request).toHaveBeenCalledTimes(1);
//       expect(client.request).toHaveBeenCalledWith(IMPORT_ENTITY_QUERY, { entity: entity, entityRef: "user:default/user 1" });
//     });

//     it('raises an error if the query failed', async () => {
//       const entity = { kind: "user", "name": "User 1" };
//       client.request.mockImplementation(() => { throw Error("Could not connect!"); });

//       expect(() => { opsLevelAPI.exportEntity(entity); }).toThrow(Error("Could not connect!"));
//     });
//   });
// });
