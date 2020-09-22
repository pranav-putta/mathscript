#include <iostream>
#include <string>
#include <array>
#include <vector>
#include <map>

#include "token.h"
#include "global.h"
#include "lexer.h"
#include "parser.h"
#include "ast.h"

using namespace std;

int main() {
    std::string str;
    while (true) {
        getline(std::cin, str);
        if (str == "quit") {
            break;
        }
        str = "f(x) = x^2 + 2*x + 1\ng(x) = 3\nf(3) + g(1)";
        Lexer lexer(str);
        Parser parser(lexer);
        ASTPtr root = parser.Parse();
        Result res = root->eval(SymTable::ConstructGlobalTable());

        for (auto &c: get<vector<ObjPtr >>(res.data)) {
            auto num = dynamic_cast<Number *>(c.get());
            std::cout << num->value << std::endl;
        }
    }
    return 0;
}
