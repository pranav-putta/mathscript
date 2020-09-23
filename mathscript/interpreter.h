//
// Created by Pranav Putta on 9/22/20.
//

#ifndef MATHSCRIPT_INTERPRETER_H
#define MATHSCRIPT_INTERPRETER_H

#include <napi.h>

#include <string>

namespace mathscript {

    //add number function
    std::string interpret(std::string input);

    //add function wrapper
    Napi::String interpretWrapped(const Napi::CallbackInfo &info);

    //Export API
    Napi::Object Init(Napi::Env env, Napi::Object exports);
    NODE_API_MODULE(interpret, Init);


}


#endif //MATHSCRIPT_INTERPRETER_H
