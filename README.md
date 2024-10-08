# Murmurations Tools

> _This project is licensed under the terms of the GNU General Public License v3.0_

## To Do

- Add IPFS functionality

## Local Development with Murmurations Services and Frontend Mongo

1. Run Murmurations Services and Frontend Mongo.
2. Ensure Local `.env` is Set Up. The following is the default `.env` setup.

   ```bash
   PUBLIC_LIBRARY_URL=http://library.murmurations.developers
   ```

3. Modify `/etc/hosts` to point tools.murmurations.developers to 127.0.0.1.

   ```bash
   127.0.0.1       tools.murmurations.developers
   ```

4. Execute `make dev`.
5. Open <http://tools.murmurations.developers> in your browser.

## Development

Install dependencies:

```sh
npm install
```

<!--

Set environment variables in the `.env` file:

```sh
npm run dev
```

-->

Open up <http://localhost:5173> and you should be ready to go!

<!--

## Enabling IPFS

Profiles created in Murmurations Tools can also be saved to IPFS as well as to your Mongo database. You will need access to an IPFS server and will have to set the credentials in your environment variables file.

You can enable IPFS functionality by changing the configuration in the `app/utils/settings.js` file:

```javascript
export const settings = {
    ipfsEnabled: true
};
```

Then save the file and restart/redeploy the app. To disable IPFS, set `ipfsEnabled` back to false and restart/redeploy again.

-->

## Try it out

<https://test-tools.murmurations.network>

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
| GET    | /profile-generator/index/:node_id       | Retrieve profiles from the Index server         |
| POST   | /profile-generator/index/:node_id       | Save a profile to the Index server              |
| DELETE | /profile-generator/index/:node_id       | Delete a profile from the Index server          |
