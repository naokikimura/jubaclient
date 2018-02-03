#!/usr/bin/env node

const readline = require('readline');
const util = require('util');
const debug = util.debuglog('jubaclient');
const rpc = require('jubatus/lib/msgpack-rpc');
const app = require('./app');

const { env: { DEBUG } } = (global.process || { env: {} });
const enabled = /\bjubaclient\b/.test(DEBUG);
Object.defineProperty(debug, 'enabled', { get() { return enabled; } });

let count = 0;
const [ service, method, port = '9190', host = 'localhost', name = '', timeout = '0' ] = process.argv.slice(2);
const client = rpc.createClient(Number(port), host, Number(timeout));

const rl = readline.createInterface({ input: process.stdin })
  .on('line', line => {
    debug(`${ ++count }: ${ line }`);
    new Promise((resolve, reject) => {
      resolve(JSON.parse(line));
    }).then(params => {
      debug(params);
      return app.request(service, method, params, client, name);
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