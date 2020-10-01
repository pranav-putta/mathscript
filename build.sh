rm -rf app/src/interpreter
mkdir app/src/interpreter

emcc interpreter/*.cpp \
	-s MODULARIZE \
	-o app/src/interpreter/interpreter.js \
	-std=c++20 -O3 -g1 \
	-s EXPORT_ES6=1 \
	-s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
	-s ASSERTIONS
