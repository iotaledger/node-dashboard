<h2 align="center">IOTA Node Dashboard</h2>

<p align="center">
  <a href="https://discord.iota.org/" style="text-decoration:none;"><img src="https://img.shields.io/badge/Discord-9cf.svg?logo=discord" alt="Discord"></a>
    <a href="https://iota.stackexchange.com/" style="text-decoration:none;"><img src="https://img.shields.io/badge/StackExchange-9cf.svg?logo=stackexchange" alt="StackExchange"></a>
    <a href="https://github.com/iotaledger/node-dashboard/blob/master/LICENSE" style="text-decoration:none;"><img src="https://img.shields.io/github/license/iotaledger/node-dashboard.svg" alt="Apache-2.0 license"></a>
</p>
      
<p align="center">
  <a href="#about">About</a> ◈
  <a href="#prerequisites">Prerequisites</a> ◈
  <a href="#getting-started">Getting started</a> ◈
  <a href="#supporting-the-project">Supporting the project</a> ◈
  <a href="#joining-the-discussion">Joining the discussion</a> 
</p>

# About

Common dashboard used by IOTA node software Hornet and Bee.

## Prerequisites

To deploy your own version of the Node Dashboard, you need to have at least [version 14 of Node.js](https://nodejs.org/en/download/) installed on your device.

To check if you have Node.js installed, run the following command:

```bash
node -v
```

If Node.js is installed, you should see the version that's installed.

# Getting Started

You need to run a local version of the Hornet node software from the main branch [https://github.com/gohornet/hornet/](https://github.com/gohornet/hornet/)

1. Make sure to set `dashboard.dev` to true in Hornet config, to enable the node to serve assets
   from the dev instance.
2. Install all needed npm modules via `npm install`.
3. Run a dev-server instance by running `npm run start` within the repo root directory.
4. Using default port config, you should now be able to access the dashboard under http://127.0.0.1:8081

The dashboard is hot-reload enabled.

## Supporting the project

If the Node Dashboard has been useful to you and you feel like contributing, consider submitting a [bug report](https://github.com/iotaledger/node-dashboard/issues/new), [feature request](https://github.com/iotaledger/node-dashboard/issues/new) or a [pull request](https://github.com/iotaledger/node-dashboard/pulls/).

See our [contributing guidelines](.github/CONTRIBUTING.md) for more information.

## Joining the discussion

If you want to get involved in the community, need help with getting set up, have any issues or just want to discuss IOTA, feel free to join our [Discord](https://discord.iota.org/).