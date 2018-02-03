#!/usr/bin/env node

const os = require('os');
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('jubaclient');
const jubatus = require('jubatus');
const rpc = require('jubatus/lib/msgpack-rpc');

const { env: { DEBUG } } = (global.process || { env: {} });
const enabled = /\bjubaclient\b/.test(DEBUG);
Object.defineProperty(debug, 'enabled', { get() { return enabled; } });

let count = 0;
const [ service, method, port = 9190, host = 'localhost', timeout = 0 ] = process.argv.slice(2);
const client = rpc.createClient(port, host, timeout);

function toCamelCase(value) {
  return value.toLowerCase().replace(/_([a-z])/g, (match, group1) => group1.toUpperCase());
}

function request(service, method, params, rpcClient) {
  const client = new jubatus[service.toLowerCase()].client[service](rpcClient);
  debug(client);
  return client[method].apply(client, params);
}
exports.request = request;

const rl = readline.createInterface({ input: process.stdin })
  .on('line', line => {
    debug(`${ ++count }: ${ line }`);
    new Promise((resolve, reject) => {
      resolve(JSON.parse(line));
    }).then(params => {
      debug(params);
      return request(toCamelCase(service), toCamelCase(method), params, client);
    }).then(response => {
      debug(response);
      const [ result, msgid ] = response;
      console.log(JSON.stringify(result));
    }).catch(error => {
      console.error(error);
    });
  })
  .on('close', () => {
    debug(`${ count }`);
    client.close();
  });