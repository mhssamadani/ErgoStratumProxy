# Simple Stratum Mining Proxy for Ergo

The current version of ergo miners only support http request and response.

In order to work with a stratum pool, this proxy is required.

This proxy is a simple wrapper that gets jobs from stratum mining pool
and creates an http interface for miner.

Windows users can use [this tutorial](https://adanorthpool.medium.com/ergostratumproxy-on-windows-wsl-for-mining-ergo-cryptocyrrency-to-a-mining-pool-2b42814cc474) in order to install the proxy.

# Quick Start
1- Download executable proxy for [Linux/Windows](https://github.com/mhssamadani/ErgoStratumProxy/releases)

2- Run the proxy with appropriate options.

In Windows PowerShell:
```
.\ErgoStratumProxy.exe -s <POOL_ADDRESS> -p <POOL_PORT> -u <WORKER_NAME>
```
In linux:
```
./ErgoStratumProxy_Linux -s <POOL_ADDRESS> -p <POOL_PORT> -u <WORKER_NAME>
```
![](https://raw.githubusercontent.com/mhssamadani/ErgoStratumProxy/main/img/quickrun.jpg)

See other options by running with `-h` argument

# Miner Configuration
- In the miner's config file `config.json` set node address to the proxy's address
 (by default this address is: ```{ "node" : "http://127.0.0.1:3000" }```, unless you have changed the listening port)

# Build from Source

1- Install Node v12+ and npm

2- Install package dependencies:

```
npm install
```
## Usage

In order to use ERGO miners with a stratum pool, this proxy is required.
- Install this proxy
- Pass arguments to [`client.js`](https://github.com/mhssamadani/ErgoStratumProxy/blob/main/client.js):

![](https://raw.githubusercontent.com/mhssamadani/ErgoStratumProxy/main/img/arguments.png)

  - Among these arguments, listening port (-l) and password (-w) are optional.

- Start proxy
```
node client.js -s <POOL_ADDRESS> -p <POOL_PORT> -u <WORKER_NAME>
```

![](https://raw.githubusercontent.com/mhssamadani/ErgoStratumProxy/main/img/start.png)


