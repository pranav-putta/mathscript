import { time } from "console";
import React from "react";
import { View, StyleSheet, Text, TextInput } from "react-native";
import interpreter from "../interpreter/interpreter.js";

interface Props {}

interface State {
  input: string;
  result: any;
  interpret: (input: string) => Promise<any>;
}

export default class Home extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      input: "",
      result: "",
      interpret: (input: string) => {
        return Promise.resolve("interpreter unloaded");
      },
    };
  }

  componentDidMount() {
    this.load();
  }

  load = async () => {
    const mod = await interpreter({
      noInitialRun: true,
      noExitRuntime: true,
    });
    const interpret = mod.cwrap("interpret", "number", ["string"]);
    const func = async (x: string) => {
      return interpret(x);
    };
    this.setState({ interpret: func });
  };

  inputChange = (text: string) => {
    let now = Date.now();
    this.setState({ input: text, result: "loading..." }, () => {
      this.state
        .interpret(text)
        .then((out) => {
          let t = Date.now() - now;
          this.setState({ result: out });
        })
        .catch((err) => {
          this.setState({ result: "couldn't interpret!" });
        });
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          value={this.state.input}
          onChangeText={this.inputChange}
          multiline={true}
          style={[styles.input, styles.textInput]}
        />
        <TextInput
          value={this.state.result}
          onChangeText={this.inputChange}
          multiline={true}
          style={[styles.output, styles.textInput]}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  input: {
    flex: 4,
    backgroundColor: "#282c34",
    color: "white",
  },
  output: {
    flex: 2,
    color: "#0288d1",
  },
  textInput: {
    fontFamily: "sans-serif",
    fontSize: 24,
    fontWeight: "400",
    padding: 12,
  },
});
