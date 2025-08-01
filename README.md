# Bucketeer MCP Server

A Model Context Protocol (MCP) server for managing feature flags in [Bucketeer](https://bucketeer.io/), an open-source feature flag management platform.


> [!WARNING]
> This is a beta version. Breaking changes may be introduced before general release.

## Features

This MCP server provides tools for basic CRUD operations on Bucketeer feature flags:

- `listFeatureFlags` - List all feature flags with filtering and pagination
- `createFeatureFlag` - Create a new feature flag
- `getFeatureFlag` - Get a specific feature flag by ID
- `updateFeatureFlag` - Update an existing feature flag
- `archiveFeatureFlag` - Archive a feature flag (make it inactive)

## Prerequisites

- Node.js 18 or higher
- A Bucketeer instance with API access
- An API key with appropriate permissions (READ, WRITE, or ADMIN)

## Installation

### Using npx (Recommended)

The easiest way to use Bucketeer MCP Server is directly with `npx` - no installation required:

```bash
npx @bucketeer/mcp
```

### Local Installation

1. Clone this repository
```bash
git clone https://github.com/bucketeer-io/bucketeer-mcp.git
cd bucketeer-mcp
```

2. Install dependencies
```bash
npm install
```

3. Build the project
```bash
npm run build
```

## Usage

### Running the Server

#### Using npx (No Installation Required)

```bash
npx @bucketeer/mcp
```

#### Using Local Installation

Start the MCP server
```bash
npm start
```

For development with auto-reload
```bash
npm run dev
```

### MCP Client Configuration

To use this server with an MCP client, add it to your MCP client configuration.

#### Using npx (Recommended)

```json
{
  "mcpServers": {
    "bucketeer": {
      "command": "npx",
      "args": ["@bucketeer/mcp"],
      "env": {
        "BUCKETEER_HOST": "api.bucketeer.io",
        "BUCKETEER_API_KEY": "your-api-key",
        "BUCKETEER_ENVIRONMENT_ID": "your-environment-id"
      }
    }
  }
}
```

#### Using Local Installation

```json
{
  "mcpServers": {
    "bucketeer": {
      "command": "node",
      "args": ["/path/to/bucketeer-mcp/dist/index.js"],
      "env": {
        "BUCKETEER_HOST": "api.bucketeer.io",
        "BUCKETEER_API_KEY": "your-api-key",
        "BUCKETEER_ENVIRONMENT_ID": "your-environment-id"
      }
    }
  }
}
```

### Available Tools

#### listFeatureFlags

List all feature flags in the specified environment.

Parameters:
- `environmentId` (optional) - Environment ID (uses default if not provided)
- `pageSize` (optional) - Number of items per page (1-100, default: 20)
- `cursor` (optional) - Pagination cursor for next page
- `tags` (optional) - Filter by tags
- `orderBy` (optional) - Field to order by (CREATED_AT, UPDATED_AT, NAME)
- `orderDirection` (optional) - Order direction (ASC, DESC)
- `searchKeyword` (optional) - Search keyword for feature name or ID
- `maintainer` (optional) - Filter by maintainer email
- `archived` (optional) - Filter by archived status

#### createFeatureFlag

Create a new feature flag.

Parameters:
- `id` (required) - Unique identifier (alphanumeric, hyphens, underscores)
- `name` (required) - Human-readable name
- `description` (optional) - Description of the feature flag
- `environmentId` (optional) - Environment ID (uses default if not provided)
- `variations` (required) - Array of variations (at least 2)
  - `value` (required) - The value returned when this variation is served
  - `name` (required) - Name of the variation
  - `description` (optional) - Description of the variation
- `tags` (optional) - Tags for the feature flag
- `defaultOnVariationIndex` (required) - Index of variation when flag is on (0-based)
- `defaultOffVariationIndex` (required) - Index of variation when flag is off (0-based)
- `variationType` (optional) - Type of the variation values: STRING (default), BOOLEAN, NUMBER, or JSON

#### getFeatureFlag

Get a specific feature flag by ID.

Parameters:
- `id` (required) - The ID of the feature flag to retrieve
- `environmentId` (optional) - Environment ID (uses default if not provided)
- `featureVersion` (optional) - Specific version of the feature to retrieve

#### updateFeatureFlag

Update an existing feature flag.

Parameters:
- `id` (required) - The ID of the feature flag to update
- `comment` (required) - Comment for the update (required for audit trail)
- `environmentId` (optional) - Environment ID (uses default if not provided)
- `name` (optional) - New name for the feature flag
- `description` (optional) - New description
- `tags` (optional) - New tags
- `enabled` (optional) - Enable or disable the feature flag
- `archived` (optional) - Archive or unarchive the feature flag

Note: 
- This tool requires a comment for audit trail purposes
- It does not support updating variations. To modify variations, you would need to archive the current flag and create a new one.

#### archiveFeatureFlag

Archive a feature flag (make it inactive). Archived flags will return the default value defined in your code for all users.

Parameters:
- `id` (required) - The ID of the feature flag to archive
- `environmentId` (optional) - Environment ID (uses default if not provided)
- `comment` (required) - Comment for the archive action (required for audit trail)

Note: This operation archives the flag rather than permanently deleting it. The flag can be unarchived later if needed.


## Development


### Linting

Run the linter
```bash
npm run lint
```

### Building

Build the TypeScript code
```bash
npm run build
```

## Contributing

We would ❤️ for you to contribute to Bucketeer and help improve it! Anyone can use and enjoy it!

Please follow our contribution guide [here](https://docs.bucketeer.io/contribution-guide/).

## License

Apache License 2.0, see [LICENSE](https://github.com/bucketeer-io/openfeature-go-server-sdk/blob/main/LICENSE).