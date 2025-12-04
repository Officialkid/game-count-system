// lib/confetti.ts
export function triggerConfetti() {
  if (typeof window === 'undefined') return;

  // Simple confetti using canvas if canvas-confetti is not installed
  // You can install canvas-confetti with: npm install canvas-confetti
  // For now, using a simple DOM-based confetti effect

  const colors = ['#6b46c1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
  }
}

function createConfettiPiece(color: string) {
  const confetti = document.createElement('div');
  confetti.style.position = 'fixed';
  confetti.style.width = '10px';
  confetti.style.height = '10px';
  confetti.style.backgroundColor = color;
  confetti.style.left = Math.random() * 100 + '%';
  confetti.style.top = '-20px';
  confetti.style.opacity = '1';
  confetti.style.pointerEvents = 'none';
  confetti.style.zIndex = '9999';
  confetti.style.borderRadius = '2px';

  document.body.appendChild(confetti);

  const angle = Math.random() * 360;
  const velocity = 3 + Math.random() * 5;
  const rotationSpeed = Math.random() * 10 - 5;

  let x = parseFloat(confetti.style.left);
  let y = -20;
  let rotation = 0;
  let opacity = 1;

  const animate = () => {
    y += velocity;
    x += Math.sin(angle) * 2;
    rotation += rotationSpeed;
    opacity -= 0.01;

    confetti.style.top = y + 'px';
    confetti.style.left = x + '%';
    confetti.style.transform = `rotate(${rotation}deg)`;
    confetti.style.opacity = opacity.toString();

    if (y < window.innerHeight && opacity > 0) {
      requestAnimationFrame(animate);
    } else {
      confetti.remove();
    }
  };

  requestAnimationFrame(animate);
}
