/* global document */
import React, { Component } from 'react';
import './App.css';

const HEIGHT = 500;
const WIDTH = 800;
const PIPE_WIDTH = 80;
const MIN_PIPE_HEIGHT = 40;
const FPS = 120;

class Bird {
  constructor(ctx) {
    this.ctx = ctx;
    this.isDead = false;
    this.x = 100;
    this.y = 150;
    this.gravity = 0.03;
    this.velocity = 0;
  }

  draw(ctx) {
    this.ctx.fillStyle = 'red';
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, 15, 0, Math.PI * 2, true);
    this.ctx.fill();
  }

  update = () => {
    this.velocity += this.gravity;
    this.gravity = Math.min(0.1, this.gravity);
    this.y += this.velocity;
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
    this.space = 100;
    this.pipes = [];
    this.birds = [];
    this.deadPipes = 0;
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown);
    const ctx = this.getCtx();
    this.pipes = this.generatePipes();
    this.birds = [new Bird(ctx)];
    this.loop = setInterval(this.gameLoop, 1000 / FPS);
  }

  getCtx = () => this.canvasRef.current.getContext('2d');

  onKeyDown = (e) => {
    if (e.code === 'Space') {
      this.birds[0].jump();
    }
  }

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
    if (this.frameCount % 320 === 0) {
      const pipes = this.generatePipes();
      this.pipes.push(...pipes);
    }
    if (this.frameCount % 20 === 0) {
      this.deadPipes += 0.5;
    }

    // update pipe positions
    this.pipes.forEach(pipe => pipe.update());
    this.pipes = this.pipes.filter(pipe => !pipe.isDead);

    // update birds position
    this.birds.forEach(bird => bird.update());

    if (this.isGameOver()) {
      this.bestScore = this.deadPipes * 100;
      alert('game over');
      clearInterval(this.loop);
    }
  }

  isGameOver = () => {
    // detect collisions
    let gameOver = false;
    this.birds.forEach((bird) => {
      this.pipes.forEach((pipe) => {
        if (bird.y < 0 || bird.y > HEIGHT || (bird.x > pipe.x && bird.x < pipe.x + pipe.width && bird.y > pipe.y && bird.y < pipe.y + pipe.height)) {
          gameOver = true;
        }
      });
    });

    return gameOver;
  }

  draw = () => {
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.pipes.forEach(pipe => pipe.draw());

    this.birds.forEach(bird => bird.draw());
    ctx.fillStyle = '#ccc';
    ctx.font = '50px serif';
    ctx.fillText(`Skor: ${(this.deadPipes * 100).toFixed()}`, 10, 480);
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

      </div>
    );
  }
}

export default App;
