import { interpretSource } from ".";

while (true) {
  let input = "1 + 1";
  console.log(interpretSource(input));
  console.log(process.memoryUsage());
}
