import crypto from 'crypto';
import { query } from '@/lib/db';

export class CaptchaService {
  // Simple math-based CAPTCHA generator
  async generateCaptcha(): Promise<{ id: string; question: string; image: string }> {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let answer: number;
    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        break;
      default:
        answer = num1 + num2;
    }

    const id = crypto.randomBytes(16).toString('hex');
    const question = `${num1} ${operator} ${num2} = ?`;

    // Store CAPTCHA in database with expiration (5 minutes)
    await query(
      `INSERT INTO captcha_challenges (id, question, answer, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')`,
      [id, question, answer.toString()]
    );

    // Return a simple text-based image representation
    const image = this.generateCaptchaImage(question);

    return {
      id,
      question,
      image,
    };
  }

  async verifyCaptcha(captchaId: string, userAnswer: string): Promise<boolean> {
    const result = await query(
      `SELECT answer FROM captcha_challenges
       WHERE id = $1 AND expires_at > NOW()`,
      [captchaId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const isValid = result.rows[0].answer === userAnswer;

    // Delete used CAPTCHA
    await query('DELETE FROM captcha_challenges WHERE id = $1', [captchaId]);

    return isValid;
  }

  async shouldRequireCaptcha(userEmail: string): Promise<boolean> {
    // Check if user has made too many failed login attempts
    const result = await query(
      `SELECT failed_attempts FROM login_attempts
       WHERE email = $1 AND attempt_time > NOW() - INTERVAL '15 minutes'`,
      [userEmail]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].failed_attempts >= 3;
  }

  private generateCaptchaImage(question: string): string {
    // Simple SVG-based CAPTCHA representation
    const svg = `
      <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="80" fill="white" stroke="black" stroke-width="2"/>
        <circle cx="30" cy="20" r="15" fill="none" stroke="black"/>
        <circle cx="60" cy="50" r="20" fill="none" stroke="black"/>
        <text x="50" y="50" font-size="24" font-weight="bold" text-anchor="middle">${question}</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

export const captchaService = new CaptchaService();
