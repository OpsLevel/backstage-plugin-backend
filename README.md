[![Overall](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fapp.opslevel.com%2Fapi%2Fservice_level%2FL6pkRwdgleo4ZoLC4IaR0LaNwaesYvv7LP70yg-qpwI)](https://app.opslevel.com/services/backstage-plugin-backend/maturity-report)
[![npm](https://img.shields.io/npm/v/@opslevel/backstage-maturity-backend)](https://www.npmjs.com/package/@opslevel/backstage-maturity-backend)

# OpsLevel Maturity Backend Plugin
This plugin, in combination with the [frontend plugin](https://github.com/OpsLevel/backstage-plugin), provides automatic, scheduled
export functionality of users, groups, and components from Backstage into OpsLevel.

## Installation

### Step 1

In the root directory of your Backstage installation, run the following command:

```bash
yarn add --cwd packages/backend @opslevel/backstage-maturity-backend @backstage/plugin-proxy-backend
```

### Step 2

Open the `index.ts` file in the `packages/backend/src` subdirectory of your Backstage installation with the code editor of your choice.

```ts
// packages/backend/src/index.ts
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@opslevel/backstage-maturity-backend'));
```

### Step 3

Set up the necessary configuration in your Backstage instance's `app-config.yaml`. Note: that this configuration is the same as for installing the installing the [frontend plugin](https://github.com/OpsLevel/backstage-plugin), if you've already done the changes in `app-config.yaml` for the frontend plugin, you don't need to do this again.

### Set Up the Proxy Configuration

Add a proxy configuration for OpsLevel. Replace `<your_OpsLevel_API_token>` with a token from https://app.opslevel.com/api_tokens (or, if you're running a self-hosted OpsLevel instance, the `/api_tokens` page on your OpsLevel instance).

```yaml
proxy:
  endpoints:
    '/opslevel':
      target: 'https://app.opslevel.com'
      credentials: 'dangerously-allow-unauthenticated'
      headers:
        X-Custom-Source: backstage
        Authorization: Bearer <your_OpsLevel_API_token>
      allowedHeaders: ['GraphQL-Visibility']
```

If you're running Self-Hosted OpsLevel, replace `target` with your URL.

### Set Up the Base OpsLevel URL

```yaml
opslevel:
  baseUrl: 'https://app.opslevel.com'
```

If you're running Self-Hosted OpsLevel, replace `baseUrl` with your URL.
