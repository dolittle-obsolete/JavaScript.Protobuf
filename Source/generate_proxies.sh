#!/bin/bash
echo "Generate Proxies"
find . -type f -iname '*.ts' ! -iname "index.*" -not -path './node_modules/*' -delete
find . -type f -iname '*.js' ! -iname "index.*" -not -path './node_modules/*' -delete

echo $*

npx protoc  --js_out=import_style=commonjs,binary:./ \
            --ts_out=service=grpc-node:./ \
            --plugin=protoc-gen-ts=$nodemodules'/.bin/protoc-gen-ts' \
            $*