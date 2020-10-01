cmake_minimum_required(VERSION 3.17)
project(mathscript)

set(CMAKE_CXX_STANDARD 20)
add_executable(mathscript lexer.cpp lexer.h token.cpp token.h errors.h errors.cpp global.cpp global.h parser.cpp parser.h ast.cpp ast.h data.cpp data.h symtable.cpp symtable.h units.cpp units.h)