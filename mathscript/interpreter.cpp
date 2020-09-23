//
// Created by Pranav Putta on 9/22/20.
//

#include "lexer.h"
#include "parser.h"
#include "ast.h"
#include "interpreter.h"

std::string mathscript::interpret(std::string input) {
    Lexer lexer(input);
    Parser parser(lexer);
    ASTPtr root = parser.Parse();
    Result res = root->eval(SymTable::ConstructGlobalTable());

    std::string out;
    for (auto &c: std::get<std::vector<ObjPtr >>(res.data)) {
        auto num = dynamic_cast<Number *>(c.get());
        out += std::to_string(num->value) + "\n";
    }
    return out;
}

Napi::String mathscript::interpretWrapped(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    //check if arguments are integer only.
    if (info.Length() < 2 || !info[0].IsString()) {
        Napi::TypeError::New(env, "arg1::String expected").ThrowAsJavaScriptException();
    }
    //convert javascripts datatype to c++
    Napi::String first = info[0].As<Napi::String>();
    //run c++ function return value and return it in javascript
    Napi::String returnValue = Napi::String::New(env, mathscript::interpret(first.Utf8Value()));

    return returnValue;
}

Napi::Object mathscript::Init(Napi::Env env, Napi::Object exports) {
    //export Napi function
    exports.Set("interpret", Napi::Function::New(env, mathscript::interpretWrapped));
    return exports;
}