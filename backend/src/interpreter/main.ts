import readlineSync from "readline-sync";
import { Interpreter, interpretSource } from "./interpreter";

while (true) {
  let input = readlineSync.question(">  ");
  console.log(interpretSource(input));
}
