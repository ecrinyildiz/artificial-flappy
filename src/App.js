import React, { Component } from 'react';
import './App.css';

const HEIGHT = 500;
const WIDTH = 800;
const PIPE_WIDTH = 50;
const MIN_PIPE_HEIGHT = 40;

class Pipe {
  constructor() {

  }

  draw(ctx) {

  }
}


class App extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.fillStyle = '#662324';

    // math.random -> 0,1 arası değer
    const space = 80;
    const firstPipeHeight = MIN_PIPE_HEIGHT + Math.random() * (HEIGHT - space - 2 * MIN_PIPE_HEIGHT);
    const secondPipeHeight = HEIGHT - firstPipeHeight - space;
    ctx.fillRect(WIDTH, 0, PIPE_WIDTH, firstPipeHeight);
    ctx.fillRect(WIDTH, firstPipeHeight + space, PIPE_WIDTH, secondPipeHeight);
  }


  render() {
    return (
      <div className="App">
        <canvas
          ref={this.canvasRef}
          id="canvas"
          width={WIDTH}
          height={HEIGHT}
          style={{ marginTop: '24px', border: '3px solid #c3c3c3' }}
        />
      </div>

    );
  }
}

export default App;
