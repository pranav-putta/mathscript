import React from 'react'
import { Text } from 'react-native'
import interpreter from '../interpreter/interpreter.js'


interface Props {

}

interface State {
  output: number
}

export default class Home extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      output: 0
    }
  }

  componentDidMount() {
    const mod = interpreter({});
  }

  render() {
    return <Text>{this.state.output}</Text>
  }
}