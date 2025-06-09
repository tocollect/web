import React, { useEffect, useRef } from 'react';

const NotFoundPage = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Ajusta el tamaño del canvas para que sea responsive pero con un mínimo/máximo
    canvas.width = Math.min(window.innerWidth * 0.9, 700);
    canvas.height = Math.min(window.innerHeight * 0.7, 500);

    // --- Variables del Juego ---
    let bird = {
      x: canvas.width / 5,
      y: canvas.height / 2,
      radius: 15,
      velocity: 0,
      gravity: 0.3,
      jumpForce: -6
    };

    let pipes = [];
    let pipeWidth = 60;
    let pipeGap = 130;
    let initialPipeSpeed = 2; // Velocidad inicial
    let pipeSpeed = initialPipeSpeed; // Velocidad actual, que irá aumentando
    let speedIncreaseFactor = 0.05; // Cuánto aumenta la velocidad por cada punto/intervalo
    let score = 0;
    let gameOver = false;
    let frameCount = 0;

    // --- Funciones de Dibujo ---

    function drawBird() {
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
    }

    function drawPipes() {
      const pipeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#191970';
      const pipeBorderColor = '#000733';

      for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        ctx.fillStyle = pipeColor;
        ctx.fillRect(p.x, 0, pipeWidth, p.top);
        ctx.fillRect(p.x, p.bottom, pipeWidth, canvas.height - p.bottom);
        ctx.strokeStyle = pipeBorderColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, 0, pipeWidth, p.top);
        ctx.strokeRect(p.x, p.bottom, pipeWidth, canvas.height - p.bottom);
      }
    }

    function drawScore() {
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#111827';
      ctx.fillStyle = textColor;
      ctx.font = '24px "Arial", sans-serif';
      ctx.fillText(`Puntuación: ${score}`, 10, 30);
    }

    function drawGameOver() {
      ctx.fillStyle = '#DC2626';
      ctx.font = 'bold 48px "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡GAME OVER!', canvas.width / 2, canvas.height / 2 - 30);

      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#4b5563';
      ctx.fillStyle = textColor;
      ctx.font = '24px "Arial", sans-serif';
      ctx.fillText('Pulsa ESPACIO para Reiniciar', canvas.width / 2, canvas.height / 2 + 20);
    }

    // --- Lógica del Juego ---

    function update() {
      if (gameOver) return;

      // Actualizar pájaro
      bird.velocity += bird.gravity;
      bird.y += bird.velocity;

      // Comprobar colisión con el suelo o techo
      if (bird.y + bird.radius > canvas.height) {
        bird.y = canvas.height - bird.radius;
        gameOver = true;
      }
      if (bird.y - bird.radius < 0) {
        bird.y = bird.radius;
        bird.velocity = 0;
      }

      // Mover tuberías
      for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        p.x -= pipeSpeed; // ¡Aquí usamos la velocidad que aumenta!

        if (
          bird.x + bird.radius > p.x &&
          bird.x - bird.radius < p.x + pipeWidth &&
          (bird.y - bird.radius < p.top || bird.y + bird.radius > p.bottom)
        ) {
          gameOver = true;
        }

        if (p.x + pipeWidth < bird.x - bird.radius && !p.passed) {
          score++;
          p.passed = true;
          // Aumentar la velocidad cada vez que se pasa una tubería
          pipeSpeed += speedIncreaseFactor;
        }
      }

      if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
        pipes.shift();
      }

      frameCount++;
      if (frameCount % 120 === 0) {
        let topHeight = Math.random() * (canvas.height - pipeGap - 150) + 50;
        pipes.push({
          x: canvas.width,
          top: topHeight,
          bottom: topHeight + pipeGap,
          passed: false
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPipes();
      drawBird();
      drawScore();

      if (gameOver) {
        drawGameOver();
      }
    }

    function loop() {
      update();
      draw();
      if (!gameOver) {
        requestAnimationFrame(loop);
      }
    }

    function resetGame() {
      bird = {
        x: canvas.width / 5,
        y: canvas.height / 2,
        radius: 15,
        velocity: 0,
        gravity: 0.3,
        jumpForce: -6
      };
      pipes = [];
      score = 0;
      gameOver = false;
      frameCount = 0;
      pipeSpeed = initialPipeSpeed; // Restablecer la velocidad al inicio del juego
      loop();
    }

    // --- Control de Eventos ---

    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameOver) {
          resetGame();
        } else {
          bird.velocity = bird.jumpForce;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Iniciar el juego
    resetGame();

    // Limpieza al desmontar el componente
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Obtenemos los valores de las variables CSS para usarlos en el estilo inline
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#191970';
  const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#111827';
  const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#4b5563';
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e5e7eb';
  const shadowMd = getComputedStyle(document.documentElement).getPropertyValue('--shadow-md') || '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  const radiusMd = getComputedStyle(document.documentElement).getPropertyValue('--radius-md') || '12px';
  const bgLight = getComputedStyle(document.documentElement).getPropertyValue('--bg-light') || '#f9fafb';


  return (
    <div style={{
      textAlign: 'center',
      marginTop: '40px', // Un poco más de margen superior
      fontFamily: 'var(--text-primary), sans-serif',
      color: textPrimary,
      backgroundColor: bgLight,
      padding: '20px',
      borderRadius: radiusMd,
      boxShadow: shadowMd,
      maxWidth: '800px',
      margin: '40px auto',
      border: `1px solid ${borderColor}`
    }}>
      <h1 style={{ color: primaryColor, marginBottom: '10px' }}>PÁGINA NO ACCESIBLE :(</h1>
      <p style={{ color: textSecondary, fontSize: '1.1em', marginBottom: '20px' }}>
        ¡Vaya! Parece que esta página está dando problemas. ¡Pero juega un rato!
      </p>
      <canvas
        ref={canvasRef}
        style={{
          border: `3px solid ${borderColor}`,
          backgroundColor: '#A0D6B4',
          boxShadow: shadowMd,
          borderRadius: radiusMd,
          marginBottom: '15px'
        }}
      ></canvas>
      <p style={{ marginTop: '15px', fontSize: '1.1em', color: textSecondary }}>
        Pulsa la **barra espaciadora** para que el pájaro salte.
      </p>
    </div>
  );
};

export default NotFoundPage;