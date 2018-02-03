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
jubaclassifier -f ./config.json -D

# classifier#train()
echo '[ [ [ "baz", [ [ [ "foo", "bar" ] ] ] ] ] ]' | \
  jubaclient classifier train | jq '.'
```

## Requires ##

- [Node.js](https://nodejs.or]) v6+

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
## Tutorial ##

### Classifier ####

See also http://jubat.us/en/tutorial/classifier.html

configure: gender.json
```json
{
  "method": "AROW",
  "converter": {
    "num_filter_types": {}, "num_filter_rules": [],
    "string_filter_types": {}, "string_filter_rules": [],
    "num_types": {}, "num_rules": [],
    "string_types": {
      "unigram": { "method": "ngram", "char_num": "1" }
    },
    "string_rules": [
      { "key": "*", "type": "unigram", "sample_weight": "bin", "global_weight": "bin" }
    ]
  },
  "parameter": { "regularization_weight" : 1.0 }
}
```

start `jubaclassifier` process.

```bash
jubaclassifier -D --configpath gender.json 
```

training data: `train.csv`
```csv
male,short,sweater,jeans,1.70
female,long,shirt,skirt,1.56
male,short,jacket,chino,1.65
female,short,T shirt,jeans,1.72
male,long,T shirt,jeans,1.82
female,long,jacket,skirt,1.43
```

train

```bash
cat train.csv \
| jq -RcM 'split(",")|[[[.[0],[[["hair",.[1]],["top",.[2]],["bottom",.[3]]],[["height",(.[4]|tonumber)]]]]]]' \
| jubaclient classifier train
```

test data: `classify.csv`

```csv
short,T shirt,jeans,1.81
long,shirt,skirt,1.50
```

classify

```bash
cat classify.csv \
| jq -RcM 'split(",")|[[[[["hair",.[0]],["top",.[1]],["bottom",.[2]]],[["height",(.[3]|tonumber)]]]]]' \
| jubaclient classifier classify \
| jq '.[]|max_by(.[1])'
```
