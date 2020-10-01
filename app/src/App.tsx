import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Home from "./screens/Home";

class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Home />
      </View>
    );
  }
}

const height = Platform.OS == "web" ? "100vh" : "100%";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: height,
  },
});

export const injectWebCss = () => {
  // Only on web
  if (Platform.OS != "web") return;

  // Inject style
  const style = document.createElement("style");
  style.textContent = `textarea, select, input, button { outline: none!important; }`;
  return document.head.append(style);
};

injectWebCss();

export default App;
