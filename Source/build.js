#!/usr/bin/env node

let toolsPath = require.resolve('grpc-tools');
let nodeModulesRoot = toolsPath.substr(0, toolsPath.indexOf('/grpc-tools'));

console.log(`Using tooling from ${nodeModulesRoot}`);

const path = require('path');
const glob = require('glob');
const del = require('del');

const { exec, execSync } = require('child_process');

if (process.argv.length < 4) {
    console.log('Usage:\n')
    console.log('dolittle_proto_build grpc-node|grpc-web -I[include path] [source path(s)]')
    console.log('\n');
    console.log('You can have more than one include path, just add multiple `-I` options.');
    process.exit(0);
    return;
}

console.log('Delete existing declaration files');
del('./*.d.ts', '**/*.d.ts', '!node_modules/**/*', 'lib');

let args = '';
if( process.argv[2] == 'grpc-web' ) {
    args = `--plugin=protoc-gen-grpc-web=${path.join(__dirname, './grpc-web/macOS/protoc-gen-grpc-web')} `;
    args += '--grpc-web_out=import_style=commonjs,mode=grpcwebtext:. '
} else {
    args = `--plugin=protoc-gen-grpc=$nodemodules'/.bin/grpc_tools_node_protoc_plugin' `;
    args += `--grpc_out=./ `;
}

let patterns = ['*.proto', '**/*.proto'];
let ignorePatterns = ['', '*.proto'];

for (var i = 3; i < process.argv.length; i++) {
    let arg = process.argv[i];
    if( arg.indexOf('-') == 0 ) {
        args += `${arg} `;
        continue;
    }

    let folder = path.join(process.cwd(), arg);
    patterns.forEach((pattern, patternIndex) => {
        let files = glob.sync(pattern, {
            cwd: folder,
            ignore: ignorePatterns[patternIndex]
        });
        if (files.length > 0) {
            args += `${path.join(arg, pattern)} `;
        }
    });
}

console.log(`Looking for .proto files in '${args.trim()}'`);

process.env.nodemodules = nodeModulesRoot;

let scriptPath = path.join(__dirname, `generate_proxies.sh`);
scriptPath = `${scriptPath} ${args.trim()}`;
console.log(`Generate ${scriptPath}`)
const generate = exec(`${scriptPath}`,  (error, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);

    if (error == null) {
        console.log('Transpile any TypeScript files');
        execSync(`npx tsc --declaration false`, { stdio: 'inherit' });

        if( process.argv[2] == 'grpc-web' ) {
            console.log('Rename for web')
            execSync('for f in **/*grpc_pb*.d.ts; do mv "$f" "${f/grpc_pb/grpc_web_pb}"; done');
        }

        console.log('Copy declaration files to lib')
        execSync(`find . -name '*.d.ts' -not -path './node_modules/*' -not -path './lib/*' | cpio -pdm ./lib`, { stdio: 'inherit' });
    }
});

