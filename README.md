# jubaclient

[![npm version](https://badge.fury.io/js/jubaclient.svg)](https://badge.fury.io/js/jubaclient)
[![Build Status](https://travis-ci.org/naokikimura/jubaclient.svg?branch=master)](https://travis-ci.org/naokikimura/jubaclient)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/2f6c4944c7df41a887627318c06d92c3)](https://www.codacy.com/app/n.kimura.cap/jubaclient?utm_source=github.com&utm_medium=referral&utm_content=naokikimura/jubaclient&utm_campaign=badger)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/7f75cce83b7e4db49e8e8ce8b9398c05)](https://www.codacy.com/app/n.kimura.cap/jubaclient?utm_source=github.com&utm_medium=referral&utm_content=naokikimura/jubaclient&utm_campaign=Badge_Coverage)
[![Known Vulnerabilities](https://snyk.io/test/github/naokikimura/jubaclient/badge.svg?targetFile=package.json)](https://snyk.io/test/github/naokikimura/jubaclient?targetFile=package.json)

Jubatus CLI client (unofficial)

## Quick Start ##

```bash
# startup jubaclassifier
# For example: 
#  $ docker pull jubatus/jubatus
#  $ docker run -d -p 9199:9199 jubatus/jubatus jubaclassifier -f /opt/jubatus/share/jubatus/example/config/classifier/pa.json

# installation
npm install -g jubaclient

# classifier#train()
echo '[ [ [ "baz", [ [ [ "foo", "bar" ] ] ] ] ] ]' \
| jubaclient classifier train
```

## Requires ##

- [Node.js](https://nodejs.or]) v6+

## Installation ##

```bash
npm install -g jubaclient
```

## Usage ##

<code>**jubaclient** _service_ _method_ [**-p** _port_] [**-h** _hostname_] [**-n** _name_] [**-t** _timeoutSeconds_]</code>

<code>**jubaclient** **-i** [_service_] [_method_] [**-p** _port_] [**-h** _hostname_] [**-n** _name_] [**-t** _timeoutSeconds_]</code>

<code>**jubaclient** **-v**</code>

The `jubaclient` command requests JSON received from standard input with the specified method to the Jubatus server, and returns the response to the standard output.

JSON passed to standard input is an array of method arguments.

- For methods without arguments it is `[]`.
- If the method argument is a single string type, it should be like `[ "foo" ]`.

**Tips**: JSON formatting is useful for the [jq](https://stedolan.github.io/jq/) command.

The command line options are as follows:

- <code>_service_</code>: sevice name (`classifier`, `nearest_neighbor`, etc.)
- <code>_method_</code>: service method (`get_status`, `train`, `get_k_center`, etc.)
- <code>**-p** _port_</code> : port number (default `9199`)
- <code>**-h** _hostname_</code> : hostname (default `localhost`)
- <code>**-n** _name_</code> : name of target cluster (default `''`)
- <code>**-t** _timeoutSeconds_</code> : timeout  (default `0`)
- <code>**-i**</code> : interactive mode
- <code>**-v**</code> : Print jubaclient's version.

## Examples ##

- #save(id)
    ```bash
    echo '[ "jubaclient_save_1" ]' | jubaclient classifier save 
    ```
- #get_status()
    ```bash
    echo '[]' | jubaclient classifier get_status | jq '.' 
    ```
- #get_config()
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

## Interactive mode ##

With the `-i` option, it will be in interactive mode. When choosing service and method, it provides keyword completion system.
When you send Ctrl-C (SIGINT) you return to choosing the service and method, and sending Ctrl-D (EOT) will end the process.

Demonstration
[![asciicast](https://asciinema.org/a/161095.png)](https://asciinema.org/a/161095)

## Tutorial ##

### Classifier ####

See also http://jubat.us/en/tutorial/classifier.html

1. start `jubaclassifier` process.
    ```bash
    jubaclassifier -D --configpath gender.json 
    ```

2. train
    ```bash
    cat train.csv \
    | jq -RcM 'split(",")|[[[.[0],[[["hair",.[1]],["top",.[2]],["bottom",.[3]]],[["height",(.[4]|tonumber)]]]]]]' \
    | jubaclient classifier train
    ```

3. classify
    ```bash
    cat classify.csv \
    | jq -RcM 'split(",")|[[[[["hair",.[0]],["top",.[1]],["bottom",.[2]]],[["height",(.[3]|tonumber)]]]]]' \
    | jubaclient classifier classify \
    | jq '.[]|max_by(.[1])'
    ```

configure: `gender.json`
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

training data: `train.csv`
```csv
male,short,sweater,jeans,1.70
female,long,shirt,skirt,1.56
male,short,jacket,chino,1.65
female,short,T shirt,jeans,1.72
male,long,T shirt,jeans,1.82
female,long,jacket,skirt,1.43
```

test data: `classify.csv`

```csv
short,T shirt,jeans,1.81
long,shirt,skirt,1.50
```

Demonstration
[![asciicast](https://asciinema.org/a/160939.png)](https://asciinema.org/a/160939)
