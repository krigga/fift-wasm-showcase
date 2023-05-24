# FIFT WASM showcase

**WARNING:** the code shown in this repo is highly experimental and unpolished. While it does work, it needs some work before it can be safely shipped to any kind of production. Read on to learn more.

This repo contains sample code that allows one to run fift in a JS environment using WASM. `funcfiftlib.js` and `funcfiftlib.wasm` are taken from the artifacts of this [pipeline](https://github.com/krigga/ton/actions/runs/5059350408). Some helper functions are taken from this [file](https://github.com/ton-community/func-js/blob/master/src/index.ts).

Here's the possibly incomplete list of things that need to be done to this code in order for it to be shippable to production:
- Handle all created pointers and free them after execution. `func-js` does that using an array ([link](https://github.com/ton-community/func-js/blob/ad6727c8d75c2a13ebaf4c64d3471934b98d1345/src/index.ts#L175)) to which all pointers are pushed after their creation, and then by calling `mod._free` on them at the end of execution.
- Handle all callbacks. [This code](https://github.com/krigga/ton/blob/29441565a7314e0536a391aa7b8a126bb8b9a5e9/crypto/fift/utils.cpp#L71-L188) issues every call that gets routed to JS, `readfile` and `writefile` are already implemented, but 2 others are missing.
- Check that the new C++ code that makes it possible is sound. The implementation was done very quickly and not much attention was paid to any possible bugs and UBs (although the added code is quite small and simple).
- Possibly rethink the use of CStyleCallback (from C++ code) at least in some cases. For example, the `writefile` callback expects an encoded status JSON object as a response, but the callback is capable of returning errors in another way too (which is actually used for `readfile` callback), so it's just a little weird. This mishap is a consequence of the C++ part of this experiment having been implemented quickly and without much thought.
- Extract a lot of stuff as params/arguments. Obviously right now a lot of stuff is hardcoded as it's all just sample code, to actually run other stuff using this some refactoring needs to be done.
- Possibly make this an npm package, similarly to func-js. If there is demand for fift packaged for running in JS environments, I'll likely do that myself, otherwise we'll see.
