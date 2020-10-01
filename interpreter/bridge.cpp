#include "bridge.h"
#include "lexer.h"
#include "parser.h"
#include "ast.h"
#include "data.h"

using namespace std;

extern "C"
{
    double interpret(string input)
    {
        Lexer lexer(input);
        Parser parser(lexer);
        ASTPtr root = parser.Parse();
        Result res = root->eval(SymTable::ConstructGlobalTable());

        for (auto &c : get<vector<ObjPtr>>(res.data))
        {
            auto num = dynamic_cast<Number *>(c.get());
            return num->value;
        }
        return -1;
    }

    int test()
    {
        return 0;
    }
}