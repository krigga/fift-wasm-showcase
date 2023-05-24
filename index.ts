import { readFile } from 'fs/promises';
import path from 'path';
import { readFileSync, writeFileSync } from 'fs';

const wasmModule = require('./funcfiftlib.js');

const copyToCString = (mod: any, str: string) => {
    const len = mod.lengthBytesUTF8(str) + 1;
    const ptr = mod._malloc(len);
    mod.stringToUTF8(str, ptr, len);
    return ptr;
};

const copyToCStringPtr = (mod: any, str: string, ptr: any) => {
    const allocated = copyToCString(mod, str);
    mod.setValue(ptr, allocated, '*');
    return allocated;
};

const copyFromCString = (mod: any, ptr: any) => {
    return mod.UTF8ToString(ptr);
};

async function main() {
    const bin = await readFile('funcfiftlib.wasm');

    const mod = await wasmModule({
        wasmBinary: new Uint8Array(bin),
    });

    const callbackPtr = mod.addFunction((_kind: any, _data: any, contents: any, error: any) => {
        const kind: string = copyFromCString(mod, _kind);
        const data: string = copyFromCString(mod, _data);
        switch (kind) {
            case 'readfile':
                try {
                    const fc = readFileSync(path.join(process.cwd(), data));
                    copyToCStringPtr(mod, JSON.stringify({ path: data, data: fc.toString('base64') }), contents);
                } catch (e) {
                    copyToCStringPtr(mod, 'could not read file ' + data, error);
                }
                return;
            case 'writefile':
                const req = JSON.parse(data);
                try {
                    writeFileSync(req.filename, Buffer.from(req.data, 'base64'));
                    copyToCStringPtr(mod, JSON.stringify({ ok: true }), contents);
                } catch (e) {
                    copyToCStringPtr(mod, JSON.stringify({ ok: false, error: 'could not write file ' + req.filename }), contents);
                }
                return;
        }
    }, 'viiii');

    const cfg = {
        include_paths: ['/', '/lib'],
        args: [],
    };

    const cfgPtr = copyToCString(mod, JSON.stringify(cfg));
    const r = mod._run_fift_callback(cfgPtr, callbackPtr);

    const resp = JSON.parse(copyFromCString(mod, r));

    console.log(resp);
}

main();