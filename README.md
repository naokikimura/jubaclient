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

## Requires ##

- [Node.js](https://nodejs.or]) v6+
