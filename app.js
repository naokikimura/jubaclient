const util = require('util');
const debug = util.debuglog('jubaclient');
const jubatus = require('jubatus');

function toCamelCase(value) {
  return value.toLowerCase().replace(/_([a-z])/g, (match, group1) => group1.toUpperCase());
}
exports.toCamelCase = toCamelCase;

function request(service, method, params, rpcClient) {
  const serviseName = toCamelCase('_' + service);
  const methodName = toCamelCase(method);
  const { [serviseName.toLowerCase()]: { client: { [serviseName]: Service } } } = jubatus;
  const client = new Service(rpcClient);
  debug(client);
  return client[methodName].apply(client, params);
}
exports.request = request;