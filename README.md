# Murmurations Tools

> _This project is licensed under the terms of the GNU General Public License v3.0_

## Local Development with Cloudflare D1 and Drizzle

1. Generate migrations

   ```bash
   npm run db:generate
   ```

2. Run migrations

   ```bash
   npm run db:migrate
   ```

## Local Development with Murmurations Services and Mongo Operator

1. Install dependencies:

   ```sh
   pnpm i
   ```

   We prefer to use [pnpm](https://pnpm.io/) instead of npm.

2. Run [Murmurations Services](https://github.com/MurmurationsNetwork/MurmurationsServices/blob/main/docs/devops/run-local-dev.md) and [Mongo Operator](https://github.com/MurmurationsNetwork/MongoOperator/tree/main?tab=readme-ov-file#local-setup).
3. Ensure Local `.env` is set up (see [`.env.example`](.env.example)).
4. Modify `/etc/hosts` to create local domain names for Murmurations Services, Mongo Operator and this Tools project.

   ```sh
   127.0.0.1   index.murmurations.developers
   127.0.0.1   library.murmurations.developers
   127.0.0.1   data-proxy.murmurations.developers
   127.0.0.1   mongo.murmurations.developers
   127.0.0.1   tools.murmurations.developers
   ```

5. Execute `make dev` or `pnpm dev`.
6. Open <http://tools.murmurations.developers> in your browser (if running `make dev`) or <http://localhost:5173> (if running `pnpm dev`).

## Server APIs

| Method | Endpoint                                | Description                                     |
| ------ | --------------------------------------- | ----------------------------------------------- |
| GET    | /profile-generator                      | Retrieve all profiles                           |
| POST   | /profile-generator                      | Save a single profile                           |
| GET    | /profile-generator/:cuid                | Retrieve a single profile by its CUID           |
| PUT    | /profile-generator/:cuid                | Update a specific profile by its CUID           |
| PATCH  | /profile-generator/:cuid                | Partially update a specific profile by its CUID |
| PATCH  | /profile-generator/:cuid/update-node-id | Update the `node_id` of a specific profile      |
| DELETE | /profile-generator/:cuid                | Delete a specific profile by its CUID           |
| GET    | /profile-generator/index/:node_id       | Retrieve a profile from the index               |
| POST   | /profile-generator/index/:node_id       | Save a profile to the index                     |
| DELETE | /profile-generator/index/:node_id       | Delete a profile from the index                 |
