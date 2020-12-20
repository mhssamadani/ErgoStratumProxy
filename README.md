##Simple Stratum mining proxy.

the current version of ergo miners only support http request and response.

to working with stratum we generate this proxy.

this proxy is a simple wrapper that get jobs from stratum mining pool
and create an http interface to response to miner

##install

first install node v12+ and npm

then install package dependencies:

```
npm install
```

then update client.js for configuration server address and port and ...

then start proxy

```
node client.js
```