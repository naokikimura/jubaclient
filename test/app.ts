import { expect } from 'chai';
import { ChildProcess, spawn } from 'child_process';
import debuglog from 'debug';
import * as rpc from 'msgpack-rpc-lite';
import portfinder from 'portfinder';
import timers from 'timers';
import * as app from '../src/app';

const debug = debuglog('jubaclient:test');

function createServerProcess(command, config, timeoutSeconds = 10, regex = /RPC server startup/) {
    const option = { port: Number(process.env.npm_package_config_test_port || 9199) };
    return portfinder.getPortPromise(option).then(port => {
        debug(`port: ${port}`);
        const args = ['-p', port, '-f', config];
        const options = { cwd: __dirname };
        return ([port, spawn(command, args, options)] as [number, ChildProcess]);
    }).then(([port, serverProcess]) => {
        const executor = (resolve, reject) => {
            const timeout = timers.setTimeout(() => {
                serverProcess.kill();
                reject(new Error('timeout!'));
            }, timeoutSeconds * 1000);
            serverProcess.on('exit', (code, signal) => {
                debug({ code, signal });
                if (code === null) {
                    reject(new Error(signal));
                    timers.clearTimeout(timeout);
                }
            });
            serverProcess.stdout.on('data', data => {
                if (regex.test(data.toString())) {
                    resolve([port, serverProcess]);
                    timers.clearTimeout(timeout);
                }
            });
            if (debug.enabled) {
                serverProcess.stdout.on('data', data => {
                    process.stderr.write(data);
                });
            }
        };
        return new Promise(executor);
    });
}

let server: ChildProcess;
let client: rpc.Client;

before(done => {
    const command = 'jubaclassifier';
    const config = 'classifier_config.json';
    createServerProcess(command, config).then(([port, serverProcess]) => {
        server = serverProcess;
        client = rpc.createClient(port);
        done();
    }).catch(done);
});

after(done => {
    client.close();
    server.kill();
    done();
});

describe('app#toCamelCase', () => {
    it('toCamelCase', done => {
        expect(app.toCamelCase('nearest_neighbor')).to.equal('nearestNeighbor');
        done();
    });
});

describe('app#toSnakeCase', () => {
    it('toSnakeCase', done => {
        expect(app.toSnakeCase('nearestNeighbor')).to.equal('nearest_neighbor');
        done();
    });
});

describe('app#request', () => {
    it('request', done => {
        app.request('classifier', 'get_status', [], client).then(result => {
            debug(result);
            expect(result).to.be.an('object');
            Object.keys(result).forEach(key => {
                const service = result[key];
                expect(service).to.be.an('object').and.to.has.property('PROGNAME', 'jubaclassifier');
            });
            done();
        }).catch(done);
    });
});

describe('app#assertServiceMethod', () => {
    it('support', done => {
        expect(() => app.assertServiceMethod('classifier', 'get_status')).to.not.throw();
        done();
    });

    it('unsupport service', done => {
        expect(() => app.assertServiceMethod('foo', 'get_status')).to.throw(/service/);
        done();
    });

    it('unsupport method', done => {
        expect(() => app.assertServiceMethod('classifier', 'bar')).to.throw(/method/);
        done();
    });
});
