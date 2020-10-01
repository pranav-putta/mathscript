import React from "react";
import { View, StyleSheet, Text, TextInput } from "react-native";
import interpreter from "../interpreter/interpreter.js";

interface Props {}

interface State {
  input: string;
  result: any;
  interpret: (input: string) => any;
}

export default class Home extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      input: "",
      result: "",
      interpret: (input: string) => {
        return "interpreter unloaded";
      },
    };
  }

  load = async () => {
    const mod = await interpreter({
      noInitialRun: true,
      noExitRuntime: true,
    });
    const interpret = mod.cwrap("interpret", "number", ["string"]);
    this.setState({ interpret: interpret });
  };

  componentDidMount() {
    this.load();
  }

  inputChange = (text: string) => {
    this.setState({ input: text });
    this.setState({ result: this.state.interpret(text) });
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
    flex: 3,
    backgroundColor: "#263238",
    color: "white",
  },
  output: {
    flex: 2,
    color: "#0288d1",
  },
  textInput: {
    fontFamily: "sans-serif-thin",
    fontSize: 20,
    padding: 12,
  },
});
