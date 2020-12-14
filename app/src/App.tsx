import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  let [out, setOutput] = useState("");

  return (
    <div className="App">
      <div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
        <textarea
          className="Input"
          onChange={(evt) => {
            let input = evt.target.value;
            import("wasm").then((module) => {
              let data = module.lib_interpret(input);
              setOutput(JSON.stringify(data));
            });
          }}
          style={{
            flex: 2,
            width: "100%",
            height: "100%",
            color: "white",
          }}
        />
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
      </div>
    </div>
  );
}

export default App;
