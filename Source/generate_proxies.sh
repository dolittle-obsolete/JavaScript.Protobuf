#!/bin/bash
echo "Generate Proxies"
find . -type f -iname '*.ts' ! -iname "index.*" -not -path './node_modules/*' -delete
find . -type f -iname '*.js' ! -iname "index.*" -not -path './node_modules/*' -delete

echo $*

npx protoc  --js_out=import_style=commonjs,binary:./ \
            --grpc_out=./ \
            --plugin=protoc-gen-grpc=$nodemodules'/.bin/grpc_tools_node_protoc_plugin' \
            --plugin=protoc-gen-ts=$nodemodules'/.bin/protoc-gen-ts' \
            $*