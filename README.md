# Simple Stratum Mining Proxy

The current version of ergo miners only support http request and response.

In order to work with a stratum pool, this proxy is required.

This proxy is a simple wrapper that gets jobs from stratum mining pool
and creates an http interface for miner.

## Installation

first install Node v12+ and npm

then install package dependencies:

```
npm install
```

then update client.js for configuration server address and port and ...

then start proxy

```
node client.js
```
## Usage

In order to use ERGO miners with a stratum pool, this proxy is required.
- Install this proxy
- Update proxy's [`client.js`](https://github.com/mhssamadani/ErgoStratumProxy/blob/main/client.js)  file:
  - [proxy running port](https://github.com/mhssamadani/ErgoStratumProxy/blob/94b4561fbb857b3dbd227535bca75db311de8d66/client.js#L139) (optional. default is 3000)
  - [Pool address and port](https://github.com/mhssamadani/ErgoStratumProxy/blob/94b4561fbb857b3dbd227535bca75db311de8d66/client.js#L7)
- Start proxy
- In the miner's config file set node address to the proxy's address
 (by default this address is: ```{ "node" : "https://127.0.0.1:3000" }```)
