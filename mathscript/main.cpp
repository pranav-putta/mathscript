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
#include "malloc/malloc.h"

#include <fstream>
#include <unistd.h>
#include "mach/mach.h"

using namespace std;

int ack(int m, int n, int &ct) {
    ct++;
    return m == 0 ? n + 1 : ((m > 0) && (n == 0)) ? ack(m - 1, 1, ct) : ((m > 0) && (n > 0)) ? ack(m - 1,
                                                                                                   ack(m, n - 1, ct),
                                                                                                   ct)
                                                                                             : 0;
}

int main() {
    std::string str;
    str = " ack(m, n) => m == 0 ? n + 1 : ((m > 0) && (n == 0)) ? ack(m - 1, 1) : ((m > 0) && (n > 0)) ? ack(m - 1,"
          "                                                                                                   ack(m, n - 1)"
          "                                                                                                   )"
          "                                                                                             : 0\nack(3, 5)";
    Lexer lexer(str);
    Parser parser(lexer);
    ASTPtr root = parser.Parse();
    Result res = root->eval(SymTable::ConstructGlobalTable());

    for (auto &c: get<vector<ObjPtr >>(res.data)) {
        auto num = dynamic_cast<Number *>(c.get());
        std::cout << num->value << std::endl;
    }
    return 0;
}
