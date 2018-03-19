#!/usr/bin/env node

import jubatus from 'jubatus';
import minimist from 'minimist';
import * as rpc from 'msgpack-rpc-lite';
import readline from 'readline';
import util from 'util';
import * as app from './app';

const debug = util.debuglog('jubaclient');

const argsOption = {
    '--': false,
    'alias': { p: 'port', h: 'host', n: 'name', t: 'timeout', i: 'interactive', v: 'version' },
    'boolean': ['i', 'v'],
    'default': { p: 9199, h: 'localhost', n: '', t: 0, i: false },
    'string': ['h', 'n']
};
const args = minimist(process.argv.slice(2), argsOption);
const { port, host, name, timeout, interactive, version } = args;
let { '_': [service, method] } = args;

if (version) {
    // tslint:disable-next-line:no-var-requires
    const npmPackage = require('./package.json');
    console.log(npmPackage.version);
    process.exit(0);
}

if (typeof port !== 'number') { throw new Error('Illegal option: -p'); }
if (typeof timeout !== 'number') { throw new Error('Illegal option: -t'); }

const client = rpc.createClient(port, host, timeout, { encode: { useraw: true } });

let count = 0;
let completions = Object.keys(jubatus);
const completer = (line: string) => {
    const hits = completions.filter(completion => completion.startsWith(line));
    return [hits.length ? hits : completions, line];
};

// tslint:disable-next-line:no-shadowed-variable
function question(rl: readline.ReadLine, message: string) {
    return new Promise<string>(resolve => rl.question(message, resolve));
}

const interfaceOption: readline.ReadLineOptions = { input: process.stdin, completer };
if (interactive) { interfaceOption.output = process.stderr; }
const rl = readline.createInterface(interfaceOption);
rl.on('line', line => {
    debug(`${++count}: ${line}`);

    if (interactive && line === '') {
        rl.prompt();
        return;
    }

    new Promise<any[]>(resolve => {
        resolve(JSON.parse(line));
    }).then(params => {
        debug(`${params}`);
        return app.request(service, method, params, client, name);
    }).then(result => {
        debug(result);
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
        .map(namespace => (jubatus as { [service: string]: any; })[namespace].client || {})
        .map(Object.keys)
        .reduce((accumulator, current) => accumulator.concat(current))
        .map(className => className.replace(/^([A-Z])/, match => match.toLowerCase()))
        .map(app.toSnakeCase);
    question(rl, `service [${service}]: `).then(serviceName => {
        service = serviceName || service;
        app.assertServiceMethod(service || service, 'get_status');
        const clientClass = app.resolveService(service);
        completions = Object.keys(clientClass.prototype)
            .concat(Object.keys(clientClass.super_.prototype))
            .map(app.toSnakeCase);
        return question(rl, `${service} method [${method}]: `);
    }).then(methodName => {
        method = methodName || method;
        app.assertServiceMethod(service, method);
        rl.setPrompt(`${service}#${method} > `);
        completions = ['[]'];

        rl.prompt();
    }).catch(error => {
        console.error(error.toString());
        process.exit(1);
    });
}).on('close', () => {
    debug(`${count}`);
    client.close();
});

if (interactive) {
    rl.write('', { ctrl: true, name: 'c' });
} else {
    app.assertServiceMethod(service, method);
}
