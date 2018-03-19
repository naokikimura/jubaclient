import assert from 'assert';
import jubatus from 'jubatus';
import * as rpc from 'msgpack-rpc-lite';
import util from 'util';

const debug = util.debuglog('jubaclient');

export function toCamelCase(value: string) {
    return value.replace(/_([a-z])/g, (match, group1) => group1.toUpperCase());
}

export function toSnakeCase(value: string) {
    return value.replace(/[A-Z]/g, match => '_' + match.toLowerCase());
}

export function resolveService(service: string) {
    const serviseName = toCamelCase('_' + service);
    const { [serviseName.toLowerCase()]: { client: { [serviseName]: Service } } } = jubatus;
    return Service;
}

export function request(service: string, method: string, params: any[], rpcClient: rpc.Client, name?: string) {
    const methodName = toCamelCase(method);
    const Service = resolveService(service);
    const client = new Service({ rpcClient, name });
    debug(client);
    return client[methodName].apply(client, params);
}

export function assertServiceMethod(service: string, method: string) {
    assert.ok(service && typeof service === 'string', 'service is required.');
    assert.ok(method && typeof method === 'string', 'method is required.');

    const serviseName = toCamelCase('_' + service);
    const namespace = serviseName.toLowerCase();
    assert.ok(Object.keys(jubatus).some(key => namespace === key), `${ namespace } is unspport service.`);

    const { [namespace]: { client: { [serviseName]: Service } } } = jubatus;
    const methodName = toCamelCase(method);
    const methodNames = Object.keys(Service.prototype).concat(Object.keys(Service.super_.prototype));
    assert.ok(methodNames.some(key => methodName === key), `${ methodName } is unspport method.`);
}
