#include "bridge.h"
#include "lexer.h"
#include "parser.h"
#include "ast.h"
#include "data.h"

#include <iostream>
#include <emscripten.h>

using namespace std;

extern "C"
{
    EMSCRIPTEN_KEEPALIVE
    double interpret(const char *rawInput)
    {
        std::string input(rawInput);
        try
        {
            Lexer lexer(input);
            Parser parser(lexer);
            ASTPtr root = parser.Parse();
            Result res = root->eval(SymTable::ConstructGlobalTable());

            Number *num;
            for (auto &c : get<vector<ObjPtr>>(res.data))
            {
                num = dynamic_cast<Number *>(c.get());
            }
            return num->value;
        }
        catch (exception ex)
        {
            return -1;
        }
        return -1;
    }
    EMSCRIPTEN_KEEPALIVE
    int test()
    {
        return -1;
    }
}
