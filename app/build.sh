cd ../interpreter
mkdir build/
cd build
emcc ../*.cpp -s WASM=1 -s EXPORTED_FUNCTIONS='["_interpret"]' -o mathscript.html -std=c++2a || exit 1
mv mathscript.js ../../app/public/wasm
mv mathscript.wasm ../../app/public/wasm
mv mathscript.html ../../app/public/wasm
cd ..
rm -rf build/