import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

interface InterpretOutput {
  disassembly: string[];
  asm: number[];
  output: [number, string][];
  result: any;
}

function format_disassembly(data: InterpretOutput) {
  let output = "";
  data.disassembly.forEach((str) => {
    output += str;
  });

  return output;
}

function format_result(data: InterpretOutput) {
  let output = "";
  data.output.forEach(el => {
    output += el[1] + "\n";
  });

  return output;
}

function App() {
  let [out, setOutput] = useState("");
  let [disassembly_out, setDisassemblyOut] = useState("");

  return (
    <div className="App">
      <div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
        <textarea
          className="Input"
          onChange={(evt) => {
            let input = evt.target.value;
            import("wasm")
              .then((module) => {
                let data: InterpretOutput = module.lib_interpret(input);
                setDisassemblyOut(format_disassembly(data));
                setOutput(format_result(data));
              })
              .catch((err) => {
                setOutput(JSON.stringify(err));
              });
          }}
          style={{
            flex: 2,
            width: "100%",
            height: "100%",
            color: "white",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <textarea
            className="Output"
            disabled={true}
            value={out}
            style={{
              flex: 1,
              width: "100%",
              height: "100%",
              backgroundColor: "white",
            }}
          />
          <textarea
            className="Disassembly"
            disabled={true}
            value={disassembly_out}
            style={{
              flex: 1,
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
