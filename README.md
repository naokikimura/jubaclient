# jubaclient

[![npm version](https://badge.fury.io/js/jubaclient.svg)](https://badge.fury.io/js/jubaclient)
[![Build Status](https://travis-ci.org/naokikimura/jubaclient.svg?branch=master)](https://travis-ci.org/naokikimura/jubaclient)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/2f6c4944c7df41a887627318c06d92c3)](https://www.codacy.com/app/n.kimura.cap/jubaclient?utm_source=github.com&utm_medium=referral&utm_content=naokikimura/jubaclient&utm_campaign=badger)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/7f75cce83b7e4db49e8e8ce8b9398c05)](https://www.codacy.com/app/n.kimura.cap/jubaclient?utm_source=github.com&utm_medium=referral&utm_content=naokikimura/jubaclient&utm_campaign=Badge_Coverage)

Jubatus CLI client (unofficial)

## Quick Start ##

```bash
# installation
npm install -g jubaclient

# startup jubaclassifier
jubaclassifier -p 9190 -f ./config.json -D

# classifier#train()
echo '[ [ [ "baz", [ [ [ "foo", "bar" ] ] ] ] ] ]' | \
  jubaclient classifier train 9190 localhost 10 | jq '.'
```

## Installation ##

```bash
npm install -g jubaclient
```

## Usage ##

<code>jubaclient _service_ _method_ [**-p** _port_] [**-h** _host_] [**-n** _name_] [**-t** _timeoutSeconds_]</code>


- <code>_service_</code>: sevice name (`classifier`, `nearest_neighbor`, etc.)
- <code>_method_</code>: service method (`get_status`, `train`, `get_k_center`, etc.)
- <code>**-p** _port_</code> : port number (default `9190`)
- <code>**-h** _host_</code> : hostname (default `localhost`)
- <code>**-n** _name_</code> : name of target cluster (default `''`)
- <code>**-t** _timeoutSeconds_</code> : timeout  (default `0`)

## Examples ##

- save(id)
    ```bash
    echo '[ "jubaclient_save_1" ]' | jubaclient classifier save 
    ```
- get_status()
    ```bash
    echo '[]' | jubaclient classifier get_status | jq '.' 
    ```
- get_config()
    ```bash
    echo '[]' | jubaclient classifier get_config | jq '.|fromjson' 
    ```
- classifier#train(data)
    ```bash
    jubaclient classifier train <<EOF | jq '.'
    [ [ [ "corge", [ [ [ "message", "<p>foo</p>" ] ] ] ] ] ]
    [ [ [ "corge", [ [ [ "message", "<p>bar</p>" ] ] ] ] ] ]
    [ [ [ "corge", [ [ [ "message", "<p>baz</p>" ] ] ] ] ] ]
    [ [ [ "grault", [ [ [ "message", "<p>qux</p>" ] ] ] ] ] ]
    [ [ [ "grault", [ [ [ "message", "<p>quux</p>" ] ] ] ] ] ]
    EOF
    ```
- classifier#classify(data)
    ```bash
    jubaclient classifier classify <<EOF | jq '.'
    [ [ [ [ [ "message", "<b>quuz</b>" ] ] ] ] ]
    EOF
    ```

## Requires ##

- [Node.js](https://nodejs.or]) v6+
