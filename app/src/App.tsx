import React from "react";
import "./App.css";
import "process";
import { interpretSource } from "./interpreter";

interface Props {}

interface State {
  input: string;
  results: string;
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      input: "",
      results: "",
    };
  }

  onInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    let input: string = event.target.value;
    let out = interpretSource(input.trim());
    if (typeof out === "string") {
      this.setState({ input: input, results: out });
    } else {
      let result = "";
      for (let o of out) {
        if (o !== undefined) {
          result += o.toString();
        }
        result += "\n";
      }
      this.setState({ input: input, results: result });
    }
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <textarea
            className="Input-Text-Area"
            value={this.state.input}
            onChange={this.onInputChange}
          />
          <textarea
            disabled={true}
            value={this.state.results}
            className="Result-Text-Area"
          />
        </header>
      </div>
    );
  }
}

export default App;
