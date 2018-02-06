#!/usr/bin/env node

const readline = require('readline');
const util = require('util');
const debug = util.debuglog('jubaclient');
const minimist = require('minimist');
const jubatus = require('jubatus');
const rpc = require('jubatus/lib/msgpack-rpc');
const app = require('./app');

const { env: { DEBUG } } = (global.process || { env: {} });
const enabled = /\bjubaclient\b/.test(DEBUG);
Object.defineProperty(debug, 'enabled', { get() { return enabled; } });

const argsOption = {
  boolean: [ 'i' ],
  string: [ 'h', 'n' ],
  alias : { 'p': 'port', 'h': 'host', 'n': 'name', 't': 'timeout', 'i': 'interactive' },
  default: { p: 9199, h: 'localhost', n: '', t: 0, i: false },
  unknown: false
};
const args = minimist(process.argv.slice(2), argsOption);
const { p: port, h: host, n: name, t: timeout, i: interactive } = args;
let { '_': [ service, method ] } = args;

if (typeof port !== 'number') { throw new Error('Illegal option: -p'); }
if (typeof timeout !== 'number') { throw new Error('Illegal option: -t'); }

const client = rpc.createClient(port, host, timeout);

let count = 0;
let completions = Object.keys(jubatus);
const completer = line => {
  const hits = completions.filter(completion => completion.startsWith(line));
  return [ hits.length ? hits : completions, line ];
};

function question(rl, message) {
  return new Promise(resolve => rl.question(message, resolve));
}

const rl = readline.createInterface({ input: process.stdin, output: process.stderr, completer });
rl.on('line', line => {
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

    if (interactive) { rl.prompt(); }
  }).catch(error => {
    console.error(error);
  });
})
.on('SIGINT', () => {
  if (!interactive) {
    rl.close();
    return;
  }

  completions = Object.keys(jubatus);
  question(rl, `service [${ service }]: `).then(serviceName => {
    service = serviceName || service;
    app.assertServiceMethod(service || service, 'get_client');
    const clientClass = app.resolveService(service);
    const notRPCMethodNames = [ 'getClient', 'getName', 'setName' ];
    const methods = Object.keys(clientClass.prototype)
      .filter(method => !(notRPCMethodNames.some(notRPCMethod => method === notRPCMethod)))
      .map(app.toSnakeCase);
    completions = methods;
    return question(rl, `${ service } method [${ method }]: `);
  }).then(methodName => {
    method = methodName || method;
    app.assertServiceMethod(service, method);
    rl.setPrompt(`${ service }#${ method } > `);
    completions = [ '[]' ];
  
    rl.prompt();
  }).catch(error => {
    console.error(error.toString());
    process.exit(1);
  });
})
.on('close', () => {
  debug(`${ count }`);
  client.close();
});

if (interactive) {
  rl.write(null, { ctrl: true, name: 'c' });
} else {
  app.assertServiceMethod(service, method);
}