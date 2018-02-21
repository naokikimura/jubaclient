#!/usr/bin/env node

const readline = require('readline');
const util = require('util');
const minimist = require('minimist');
const jubatus = require('jubatus');
const rpc = require('msgpack-rpc-lite');
const app = require('./app');

const debug = util.debuglog('jubaclient');
const enabled = debug.toString() !== (function () {}).toString();
Object.defineProperty(debug, 'enabled', { get() { return enabled; } });

const argsOption = {
    boolean: [ 'i', 'v' ],
    string: [ 'h', 'n' ],
    alias : { 'p': 'port', 'h': 'host', 'n': 'name', 't': 'timeout', 'i': 'interactive', 'v': 'version' },
    default: { p: 9199, h: 'localhost', n: '', t: 0, i: false },
    unknown: false
};
const args = minimist(process.argv.slice(2), argsOption);
const { port, host, name, timeout, interactive, version } = args;
let { '_': [ service, method ] } = args;

if (version) {
    const npmPackage = require('./package.json');
    console.log(npmPackage.version);
    process.exit(0);
}

if (typeof port !== 'number') { throw new Error('Illegal option: -p'); }
if (typeof timeout !== 'number') { throw new Error('Illegal option: -t'); }

const client = rpc.createClient(port, host, timeout, { encode: { useraw: true } });

let count = 0;
let completions = Object.keys(jubatus);
const completer = line => {
    const hits = completions.filter(completion => completion.startsWith(line));
    return [ hits.length ? hits : completions, line ];
};

function question(rl, message) {
    return new Promise(resolve => rl.question(message, resolve));
}

const interfaceOption = { input: process.stdin, completer };
if (interactive) { interfaceOption.output = process.stderr; }
const rl = readline.createInterface(interfaceOption);
rl.on('line', line => {
    debug(`${ ++count }: ${ line }`);

    if (interactive && line === '') {
        rl.prompt();
        return;
    }

    new Promise((resolve, reject) => {
        resolve(JSON.parse(line));
    }).then(params => {
        debug(params);
        return app.request(service, method, params, client, name);
    }).then(response => {
        debug(response);
        const [ result, msgid ] = response;
        const tuple = jubatus.common.toTuple(result);
        console.log(JSON.stringify(tuple));

        if (interactive) { rl.prompt(); }
    }).catch(error => {
        console.error(error);

        if (interactive) { rl.prompt(); }
    });
}).on('SIGINT', () => {
    if (!interactive) {
        rl.close();
        return;
    }

    completions = Object.keys(jubatus)
        .map(namespace => jubatus[namespace].client || {})
        .map(Object.keys)
        .reduce((accumulator, current) => accumulator.concat(current))
        .map(className => className.replace(/^([A-Z])/, (match) => match.toLowerCase()))
        .map(app.toSnakeCase);
    question(rl, `service [${ service }]: `).then(serviceName => {
        service = serviceName || service;
        app.assertServiceMethod(service || service, 'get_status');
        const clientClass = app.resolveService(service);
        completions = Object.keys(clientClass.prototype)
            .concat(Object.keys(clientClass.super_.prototype))
            .map(app.toSnakeCase);
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
}).on('close', () => {
    debug(`${ count }`);
    client.close();
});

if (interactive) {
    rl.write(null, { ctrl: true, name: 'c' });
} else {
    app.assertServiceMethod(service, method);
}