#!/usr/bin/env node

const readline = require('readline');
const util = require('util');
const debug = util.debuglog('jubaclient');
const minimist = require('minimist');
const rpc = require('jubatus/lib/msgpack-rpc');
const app = require('./app');

const { env: { DEBUG } } = (global.process || { env: {} });
const enabled = /\bjubaclient\b/.test(DEBUG);
Object.defineProperty(debug, 'enabled', { get() { return enabled; } });

let count = 0;
const argv = minimist(process.argv.slice(2), { p: 9199, h: 'localhost', n: '', t: 0 });
const { '_': [ service, method ], p: port, h: host, n: name, t: timeout } = argv;

app.assertServiceMethod(service, method);
const client = rpc.createClient(port, host, timeout);

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