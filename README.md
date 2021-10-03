# MathScript -- A 'lite' Mathematica
Built by Pranav Putta, Georgia Institute of Technology 2020

## About
MathScript is a scripting language built for optimized matrix calculations. It runs through a fully custom bytecode interpreter built using Rust. MathScript is ready to go for online usage, easy to compile into WebAssembly and deployable on ReactJS through any supported web browser.

MathScript supports recursion, ternary operations, boolean expressions, and many other standard language operations.
Matrices and units are treated as first-class citizens in MathScript, allowing users to label variables with units and have automatic conversion and simplification done through the web.

## Units
Here's an example!

<img width="1430" alt="Screen Shot 2021-10-03 at 7 27 28 PM" src="https://user-images.githubusercontent.com/13629784/135775470-7957ecd3-7a54-43f2-9ffa-a0faee39dde1.png">

And for fun, the web implementation displays the bytecode translation for you to see how the internals of this language is constructed.
<img width="1440" alt="Screen Shot 2021-10-03 at 7 29 32 PM" src="https://user-images.githubusercontent.com/13629784/135775519-5c858977-265a-4c86-bb1c-ebed24c4d28b.png">

## Recursion
<img width="1440" alt="Screen Shot 2021-10-03 at 7 35 53 PM" src="https://user-images.githubusercontent.com/13629784/135775672-eab9587e-f1dd-4b34-b854-91721318d276.png">

