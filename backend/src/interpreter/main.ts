import readlineSync from "readline-sync";
import { interpretSource } from ".";

while (true) {
  let input = readlineSync.question(">  ");
  console.log(interpretSource(input));
}
