/*#include <emscripten.h>
#include <emscripten/bind.h>
#include "bridge.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(mathscript)
{
    function("interpret", optional_override([](std::string input) -> double {
                 return mathscript::interpret(input);
             }));
}*/