SUCCESS='\033[0;32m'
REG='\033[0;33m'
NC='\033[0m'

shouldCompile=false
help=false

while getopts ":ch" option; do
    case "${option}" in
        c )
            shouldCompile=true
        ;;
		h )
			help=true
		;;
    esac
done

if $help ; then
	echo "make sure you have emscripten installed and em++ in path"
	echo -e "\t-h : help"
	echo -e "\t-c : compile cpp into wasm binary"
	exit 0
fi

if $shouldCompile ; then
	printf "${REG}Building cpp interpreter into webassembly binary${NC}\n"
    rm -rf src/interpreter
    mkdir src/interpreter
    
    emcc ../interpreter/*.cpp \
    -O3 -g1 -std=c++20 \
    -s MODULARIZE \
    -o src/interpreter/interpreter.js \
    -s EXPORT_ES6=1 \
    --bind \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
    -s WASM=1 \
    -s MALLOC=emmalloc \
    -s ALLOW_MEMORY_GROWTH=1
    
    cd src/interpreter
    mv interpreter.wasm ../../public/
    echo '/* eslint-disable */' > tmp
    cat interpreter.js >> tmp
    sed -i 's/import.meta.url/"interpreter.wasm"/g' tmp
    cp tmp interpreter.js
    rm tmp
    printf "${SUCCESS}Done building interpreter webassembly${NC}\n"
else
	printf "${REG}Not compiling cpp binaries. Use -c to build\n"
fi

exit 0