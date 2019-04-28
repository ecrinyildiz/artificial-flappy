/* global document */
import React, { Component } from 'react';
import { NeuralNetwork } from './neural/nn';
import './App.css';

const TOTAL_BIRDS = 500;
const HEIGHT = 500;
const WIDTH = 800;
const PIPE_WIDTH = 80;
const MIN_PIPE_HEIGHT = 40;
const FPS = 120;

class Bird {
  constructor(ctx, brain) {
    this.ctx = ctx;
    this.isDead = false;
    this.age = 0;
    this.fitness = 0;
    this.x = 100;
    this.y = 250;
    this.gravity = 0.03;
    this.velocity = 0;

    this.brain = brain
      ? brain.copy()
      : new NeuralNetwork(4, 8, 1);
  }

  draw(ctx) {
    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, 13, 0, Math.PI * 2, true);
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'red';
    this.ctx.stroke();
  }

  update = (spaceStartY, spaceEndY) => {
    this.age += 1;
    this.velocity += this.gravity;
    this.gravity = Math.min(0.1, this.gravity);
    this.y += this.velocity;

    if (this.y < 0) {
      this.y = 0;
    } else if (this.y > HEIGHT) {
      this.y = HEIGHT;
    }

    this.think(spaceStartY, spaceEndY);
  }

  think = (spaceStartY, spaceEndY) => {
    // inputs:
    // [bird.y, bird.x]
    const inputs = [
      this.x / WIDTH,
      this.y / HEIGHT,
      spaceStartY / HEIGHT,
      spaceEndY / HEIGHT,
    ];
    // range 0, 1
    const output = this.brain.predict(inputs);
    if (output[0] < 0.5) {
      this.jump();
    }
  }

  mutate = () => {
    this.brain.mutate((x) => {
      if (Math.random() < 0.1) {
        const offset = Math.random() * 0.5;
        return x + offset;
      }
      return x;
    });
  }

  jump = () => {
    this.velocity = -1.8;
  }
}

class Pipe {
  constructor(ctx, height, space) {
    this.ctx = ctx;
    this.isDead = false;
    this.x = WIDTH;
    this.y = height
      ? HEIGHT - height
      : 0;
    this.width = PIPE_WIDTH;
    this.height = height || MIN_PIPE_HEIGHT + Math.random() * (HEIGHT - space - MIN_PIPE_HEIGHT * 2);
  }

  draw() {
    this.ctx.fillStyle = '#114215';
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update = () => {
    this.x -= 1;
    if ((this.x + PIPE_WIDTH) < 0) {
      this.isDead = true;
    }
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.frameCount = 0;
    this.generateAge = 0;
    this.space = 90;
    this.pipes = [];
    this.birds = [];
    this.deadPipes = 0;
    this.deadBirds = [];
    this.state = {
      gameSpeed: FPS,
    };
  }

  componentDidMount() {
    // user only mode document.addEventListener('keydown', this.onKeyDown);

    this.startGame();
  }

  startGame = (bird) => {
    this.frameCount = 0;
    this.generateAge += 1;

    clearInterval(this.loop);
    this.deadPipes = 0;
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    this.pipes = this.generatePipes();
    this.birds = this.generateBirds(bird);
    this.loop = setInterval(this.gameLoop, 1000 / this.state.gameSpeed);
  }


  getCtx = () => this.canvasRef.current.getContext('2d');

  // user only mode
  // onKeyDown = (e) => {
  //   if (e.code === 'Space') {
  //     this.birds[0].jump();
  //   }
  // }

  generateBirds = (bird) => {
    const birds = [];
    const ctx = this.getCtx();
    for (let i = 0; i < TOTAL_BIRDS; i += 1) {
      birds.push(new Bird(ctx, bird && bird.brain));
    }
    return birds;
  };

  generatePipes = () => {
    const ctx = this.getCtx();
    const firstPipe = new Pipe(ctx, null, this.space);
    const secondPipeHeight = HEIGHT - firstPipe.height - this.space;
    const secondPipe = new Pipe(ctx, secondPipeHeight, 80);
    return [firstPipe, secondPipe];
  }

  gameLoop = () => {
    this.update();
    this.draw();
  }

  update = () => {
    this.frameCount = this.frameCount + 1;
    if (this.frameCount % (this.state.gameSpeed * 3) === 0) {
      const pipes = this.generatePipes();
      this.pipes.push(...pipes);
    }
    if (this.frameCount % 20 === 0) {
      this.deadPipes += 0.5;
    }

    // update pipe positions
    this.pipes.forEach(pipe => pipe.update());

    // update birds position
    this.birds.forEach((bird) => {
      const nextPipe = this.getNextPipe(bird);
      const spaceStartY = nextPipe.y + nextPipe.height;
      bird.update(spaceStartY, spaceStartY + this.space);
    });

    // delete off-screen pipes
    this.pipes = this.pipes.filter(pipe => !pipe.isDead);

    // delete dead birds
    this.updateBirdDeadState();
    this.deadBirds.push(...this.birds.filter(bird => bird.isDead));
    this.birds = this.birds.filter(bird => !bird.isDead);

    if (this.birds.length === 0) {
      let totalAge = 0;
      // calculate cumulative age
      this.deadBirds.forEach((deadBird) => {
        totalAge += deadBird.age;
      });

      // calculate fitness ratio
      this.deadBirds.forEach((deadBird) => {
        deadBird.fitness = deadBird.age / totalAge;
      });
      this.deadBirds.sort((a, b) => a.fitness <= b.fitness);
      const strongest = this.deadBirds[0];
      strongest.mutate();
      this.startGame(strongest);
    }
  }

  getNextPipe = (bird) => {
    for (let i = 0; i < this.pipes.length; i++) {
      if (this.pipes[i].x > bird.x) {
        return this.pipes[i];
      }
    }
  }

  updateBirdDeadState = () => {
    // detect collisions
    this.birds.forEach((bird) => {
      this.pipes.forEach((pipe) => {
        if (bird.y <= 0 || bird.y >= HEIGHT || (bird.x >= pipe.x && bird.x <= pipe.x + pipe.width && bird.y >= pipe.y && bird.y <= pipe.y + pipe.height)) {
          bird.isDead = true;
        }
      });
    });
  }

  //    USER ONLY MODE
  //   if (this.isGameOver()) {
  //     this.bestScore = this.deadPipes * 100;
  //      alert('game over');
  //      clearInterval(this.loop);
  //   }
  // }
  //   if (this.isGameOver()) {
  //     this.bestScore = this.deadPipes * 100;
  //      alert('game over');
  //      clearInterval(this.loop);
  //   }
  // }
  //
  // isGameOver = () => {
  //    detect collisions
  //   let gameOver = false;
  //   this.birds.forEach((bird) => {
  //     this.pipes.forEach((pipe) => {
  //       if (bird.y < 0 || bird.y > HEIGHT || (bird.x > pipe.x && bird.x < pipe.x + pipe.width && bird.y > pipe.y && bird.y < pipe.y + pipe.height)) {
  //         gameOver = true;
  //       }
  //     });
  //   });
  //
  //   return gameOver;
  // }

  draw = () => {
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.pipes.forEach(pipe => pipe.draw());

    this.birds.forEach(bird => bird.draw());
    ctx.fillStyle = '#FF00FF';
    ctx.font = '25px serif';
    ctx.fillText(`Score: ${(this.deadPipes * 100).toFixed()}`, 10, 480);
    ctx.fillText(`Alive Bird: ${(this.birds.length)}`, 10, 40);
    ctx.fillText(`Generate Age: ${(this.generateAge)}`, 10, 60);
  }

  render() {
    return (
      <div className="App">
        <canvas
          ref={this.canvasRef}
          id="canvas"
          width={WIDTH}
          height={HEIGHT}
          style={{
            marginTop: '24px',
            border: '3px solid #c3c3c3',
          }}
        />
        <div>
          <input
            type="range"
            min="120"
            max="1000"
            value={this.state.gameSpeed}
            onChange={e => this.setState({
              gameSpeed: e.target.value,
            }, this.startGame)}
          />
        </div>
        <div onClick={() => this.setState({})}>
        Hayatta kalma süresi:
          {' '}
          {' '}
          {(this.frameCount / 100).toFixed()}
        </div>
      </div>
    );
  }
}

export default App;
