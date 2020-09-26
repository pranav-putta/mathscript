test = (n) => n == 0 ? 1 : 1 + test(n - 1)
test(11420)