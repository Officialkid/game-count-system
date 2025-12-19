/**
 * Share Card Generator
 *
 * Generates static HTML-based recap cards optimized for social media sharing.
 * Supports canvas rendering for image export and DOM rendering for web previews.
 *
 * Optimized for:
 * - WhatsApp Link Preview: 1200x630px, auto-crop
 * - Twitter Card: 1200x675px, 16:9 ratio
 * - Facebook: 1200x630px (1.91:1 ratio)
 * - LinkedIn: 1200x628px
 * - Generic OG Image: 1200x630px (1.91:1 ratio)
 */

export interface ShareCardData {
  winner: string;
  points: number;
  gamesCount: number;
  eventName?: string;
  teams?: Array<{ name: string; points: number }>;
  branding?: {
    logo?: string;
    brandColor?: string;
    brandName?: string;
  };
}

/**
 * Generate HTML for share card (DOM-based rendering)
 * Used for in-browser display and canvas export
 */
export function generateShareCardHTML(data: ShareCardData): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    width: 1200px;
    height: 630px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: white;
    position: relative;
    overflow: hidden;
  `;

  // Background pattern
  const pattern = document.createElement('div');
  pattern.style.cssText = `
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 1px, transparent 1px),
      radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 2px, transparent 2px);
    background-size: 100px 100px, 200px 200px;
    opacity: 0.4;
  `;
  container.appendChild(pattern);

  // Content wrapper (z-index above pattern)
  const content = document.createElement('div');
  content.style.cssText = `
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 60px;
    text-align: center;
    box-sizing: border-box;
  `;

  // Branding (top-left corner)
  if (data.branding?.brandName || data.branding?.logo) {
    const brand = document.createElement('div');
    brand.style.cssText = `
      position: absolute;
      top: 30px;
      left: 40px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 600;
      opacity: 0.9;
    `;
    if (data.branding.logo) {
      const logo = document.createElement('img');
      logo.src = data.branding.logo;
      logo.style.cssText = 'width: 28px; height: 28px; border-radius: 4px;';
      brand.appendChild(logo);
    }
    if (data.branding.brandName) {
      const name = document.createElement('span');
      name.textContent = data.branding.brandName;
      brand.appendChild(name);
    }
    container.appendChild(brand);
  }

  // Trophy emoji (large)
  const trophy = document.createElement('div');
  trophy.style.cssText = `
    font-size: 120px;
    margin-bottom: 20px;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
    animation: pulse 1s ease-in-out infinite;
  `;
  trophy.textContent = '🏆';
  content.appendChild(trophy);

  // Event name (if provided)
  if (data.eventName) {
    const eventName = document.createElement('div');
    eventName.style.cssText = `
      font-size: 18px;
      opacity: 0.85;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    `;
    eventName.textContent = data.eventName;
    content.appendChild(eventName);
  }

  // Winner name (large)
  const winnerName = document.createElement('h1');
  winnerName.style.cssText = `
    font-size: 56px;
    font-weight: 800;
    margin: 0 0 16px 0;
    line-height: 1.1;
    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  winnerName.textContent = `${data.winner} WINS!`;
  content.appendChild(winnerName);

  // Points display
  const pointsBox = document.createElement('div');
  pointsBox.style.cssText = `
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 12px;
    padding: 16px 32px;
    margin-bottom: 20px;
    display: flex;
    gap: 32px;
    align-items: center;
  `;

  // Points
  const pointsLabel = document.createElement('div');
  pointsLabel.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  `;
  const pointsValue = document.createElement('div');
  pointsValue.style.cssText = `
    font-size: 44px;
    font-weight: 900;
    line-height: 1;
  `;
  pointsValue.textContent = `${data.points}`;
  const pointsText = document.createElement('div');
  pointsText.style.cssText = `
    font-size: 14px;
    opacity: 0.8;
    letter-spacing: 1px;
  `;
  pointsText.textContent = 'POINTS';
  pointsLabel.appendChild(pointsValue);
  pointsLabel.appendChild(pointsText);
  pointsBox.appendChild(pointsLabel);

  // Games played
  const gamesLabel = document.createElement('div');
  gamesLabel.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  `;
  const gamesValue = document.createElement('div');
  gamesValue.style.cssText = `
    font-size: 44px;
    font-weight: 900;
    line-height: 1;
  `;
  gamesValue.textContent = `${data.gamesCount}`;
  const gamesText = document.createElement('div');
  gamesText.style.cssText = `
    font-size: 14px;
    opacity: 0.8;
    letter-spacing: 1px;
  `;
  gamesText.textContent = 'GAMES';
  gamesLabel.appendChild(gamesValue);
  gamesLabel.appendChild(gamesText);
  pointsBox.appendChild(gamesLabel);

  content.appendChild(pointsBox);

  // Bottom stats (teams, date)
  const stats = document.createElement('div');
  stats.style.cssText = `
    display: flex;
    gap: 24px;
    font-size: 14px;
    opacity: 0.8;
    margin-top: 12px;
  `;

  if (data.teams && data.teams.length > 0) {
    const teamsCount = document.createElement('span');
    teamsCount.textContent = `${data.teams.length} Teams`;
    stats.appendChild(teamsCount);
  }

  const shareText = document.createElement('span');
  shareText.textContent = 'Share your GameScore recap!';
  stats.appendChild(shareText);

  content.appendChild(stats);
  container.appendChild(content);

  return container;
}

/**
 * Generate shareable card as PNG image
 * Uses canvas for rendering (browser-only)
 */
export async function generateShareCardImage(data: ShareCardData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 630);

      // Draw pattern
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let i = 0; i < 1200; i += 100) {
        for (let j = 0; j < 630; j += 100) {
          ctx.beginPath();
          ctx.arc(i, j, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Trophy emoji (using fallback text since canvas doesn't support emojis well)
      ctx.font = 'bold 120px system-ui';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('🏆', 600, 80);

      // Event name
      if (data.eventName) {
        ctx.font = '18px system-ui';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(data.eventName, 600, 200);
      }

      // Winner name
      ctx.font = 'bold 56px system-ui';
      ctx.fillStyle = 'white';
      ctx.fillText(`${data.winner} WINS!`, 600, 240);

      // Points box
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(350, 340, 500, 100, 12);
      ctx.fill();
      ctx.stroke();

      // Points
      ctx.font = 'bold 44px system-ui';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(`${data.points}`, 530, 360);
      ctx.font = '14px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('POINTS', 530, 405);

      // Games
      ctx.font = 'bold 44px system-ui';
      ctx.fillStyle = 'white';
      ctx.fillText(`${data.gamesCount}`, 820, 360);
      ctx.font = '14px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('GAMES', 820, 405);

      // Bottom text
      ctx.font = '14px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      ctx.fillText('Share your GameScore recap!', 600, 570);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/png',
        0.95
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate OpenGraph meta tags for social media previews
 */
export function generateOGMetaTags(data: ShareCardData, imageUrl: string): Record<string, string> {
  return {
    'og:title': `${data.winner} Wins! GameScore Recap`,
    'og:description': `${data.winner} scored ${data.points} points across ${data.gamesCount} games! Join on GameScore.`,
    'og:image': imageUrl,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:type': 'image/png',
    'og:type': 'website',
    'twitter:card': 'summary_large_image',
    'twitter:title': `${data.winner} Wins! GameScore Recap`,
    'twitter:description': `${data.winner} scored ${data.points} points across ${data.gamesCount} games!`,
    'twitter:image': imageUrl,
  };
}

/**
 * Download image to user's device
 */
export async function downloadShareCard(imageBlob: Blob, filename: string = 'gamescore-recap.png'): Promise<void> {
  const url = URL.createObjectURL(imageBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy share link to clipboard
 */
export async function copyShareLink(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

/**
 * Generate unique share URL
 */
export function generateShareURL(baseUrl: string, recapId: string): string {
  return `${baseUrl}/recap/${recapId}`;
}
