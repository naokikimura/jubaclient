const assert = require('assert');
const util = require('util');
const debug = util.debuglog('jubaclient');
const jubatus = require('jubatus');

function toCamelCase(value) {
  return value.replace(/_([a-z])/g, (match, group1) => group1.toUpperCase());
}
exports.toCamelCase = toCamelCase;

function toSnakeCase(value) {
  return value.replace(/[A-Z]/g, (match) => '_' + match.toLowerCase());
}
exports.toSnakeCase = toSnakeCase;

function request(service, method, params, rpcClient, name) {
  const serviseName = toCamelCase('_' + service);
  const methodName = toCamelCase(method);
  const { [serviseName.toLowerCase()]: { client: { [serviseName]: Service } } } = jubatus;
  const client = new Service({ rpcClient, name });
  debug(client);
  return client[methodName].apply(client, params);
}
exports.request = request;

function assertServiceMethod(service, method) {
  assert.ok(service && typeof service === 'string', 'service is required.');
  assert.ok(method && typeof method === 'string', 'method is required.');

  const serviseName = toCamelCase('_' + service);
  const namespace = serviseName.toLowerCase();
  assert.ok(Object.keys(jubatus).some(key => namespace === key), `${ namespace } is unspport service.`);

  const { [namespace]: { client: { [serviseName]: Service } } } = jubatus;
  const methodName = toCamelCase(method);
  assert.ok(Object.keys(Service.prototype).some(key => methodName === key), `${ methodName } is unspport method.`);
}
exports.assertServiceMethod = assertServiceMethod;