const expect = require('chai').expect;
const debug = require('debug')('jubaclient:test');
const timers = require('timers');
const spawn = require('child_process').spawn;
const portfinder = require('portfinder');
const rpc = require('jubatus/lib/msgpack-rpc');
const app = require('../app');

function createServerProcess(command, config, timeoutSeconds = 10, regex = /RPC server startup/) {
  const option = { port: Number(process.env.npm_package_config_test_port || 9199) };
  return portfinder.getPortPromise(option).then(port => {
      debug(`port: ${ port }`);
      return new Promise((resolve, reject) => {
          const args = [ '-p', port, '-f', config ], options = { cwd: __dirname };
          resolve([port, spawn(command, args, options) ]);
      });
  }).then(([ port, serverProcess ]) => {
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
                resolve([ port, serverProcess ]);
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

let server;
let client;

before(done => {
    const command = 'jubaclassifier', config = 'classifier_config.json';
    createServerProcess(command, config).then(([ port, serverProcess ]) => {
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

describe('app#request', () => {
    it('request', done => {
        app.request('Classifier', 'getStatus', [], client).then(([ result ]) => {
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