import React, { useEffect } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";

interface Props {}
interface State {
  instance: any;
}

export default class App extends React.Component<Props, State> {
  componentDidMount() {
  }

  loadWasm = async () => {
    try {
      const wasm = await import("mathscript");
      alert(JSON.stringify(wasm));
      this.setState({ instance: wasm });
    } catch (err) {
      console.error(`Unexpected error in loadWasm. [Message: ${err.message}]`);
    }
  };

  render() {
    const wasmURL = "http://localhost:3000/mathscript.wasm";
    this.loadWasm()
    return (
      <View style={styles.container}>
        <TextInput multiline={true} style={styles.input} />
        <TextInput multiline={true} style={styles.output} />
      </View>
    );
  }
}

const height = Platform.OS == "web" ? "100vh" : "100%";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    flexDirection: "row",
    height: height,
  },
  input: {
    flex: 6,
    padding: 10,
    backgroundColor: "#282c34",
    color: "white",
  },
  output: {
    flex: 4,
    padding: 10,
    color: "blue",
  },
});

export const injectWebCss = () => {
  // Only on web
  if (!(Platform.OS == "web")) return;

  // Inject textarea outline style
  const style = document.createElement("style");
  style.textContent = `textarea, select, input, button { outline: none!important; }`;
  return document.head.append(style);
};

injectWebCss();
