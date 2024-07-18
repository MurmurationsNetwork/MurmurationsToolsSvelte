# Murmurations Tools

> _This project is licensed under the terms of the GNU General Public License v3.0_

## To Do

- Set up environment variables
- Add IPFS functionality

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
