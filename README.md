
# OpsLevel Maturity Backend Plugin
This plugin, in combination with the [frontend plugin](https://github.com/OpsLevel/backstage-plugin), provides automatic, scheduled
export functionality of users, groups, and components from Backstage into OpsLevel.

## Installation

### Step 1

In the root directory of your Backstage installation, run the following command:

```bash
yarn add --cwd packages/backend backstage-plugin-opslevel-backend
```

### Step 2

Create a file called `opslevel.ts` in the `packages/backend/src/plugins` subdirectory of your Backstage installation and insert the following contents:

```ts
import { Router } from 'express';
import { PluginEnvironment } from '../types';
import { OpsLevelBuilder } from 'backstage-plugin-opslevel-backend';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await OpsLevelBuilder.create(env);
  const router = await builder.build();

  return router;
}
```

### Step 3

Open the `index.ts` file in the `packages/backend/src` subdirectory of your Backstage installation with the code editor of your choice.

#### Step 3.1

Add the following line after the end of the existing import statements:

```ts
import opslevel from './plugins/opslevel';
```

#### Step 3.2

Add the following statement to the cluster of similar statements near the top of the `main()` function:

```ts
const opslevelEnv = useHotMemoize(module, () => createEnv('opslevel'));
```

#### Step 3.3

Add the following statement to the cluster of similar statements a bit further down in the `main()` function:

```ts
apiRouter.use('/opslevel', await opslevel(opslevelEnv));
```

### Step 4

If you haven't done so already when installing the [frontend plugin](https://github.com/OpsLevel/backstage-plugin), update your `app-config.yaml` file to add a proxy for OpsLevel. Replace `<your_OpsLevel_API_token>` with a token from https://app.opslevel.com/api_tokens.

```yaml
proxy:
  '/opslevel':
    target: 'https://app.opslevel.com'
    headers:
      X-Custom-Source: backstage
      Authorization: Bearer <your_OpsLevel_API_token>
    allowedHeaders: ['GraphQL-Visibility']
```

### Maturity of this Plugin

[![Overall](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fapp.opslevel.com%2Fapi%2Fservice_level%2FL6pkRwdgleo4ZoLC4IaR0LaNwaesYvv7LP70yg-qpwI)](https://app.opslevel.com/services/backstage-plugin-backend/maturity-report)
