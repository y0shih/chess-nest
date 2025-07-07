import { Injectable } from '@nestjs/common';

@Injectable()
export class EloService {
  calculateEloChange(
    playerElo: number,
    opponentElo: number,
    result: 'win' | 'loss' | 'draw',
  ): number {
    const kFactor = this.getKFactor(playerElo);
    const expectedScore = this.getExpectedScore(playerElo, opponentElo);

    let actualScore: number;
    switch (result) {
      case 'win':
        actualScore = 1;
        break;
      case 'loss':
        actualScore = 0;
        break;
      case 'draw':
        actualScore = 0.5;
        break;
    }

    const eloChange = Math.round(kFactor * (actualScore - expectedScore));
    // Apply your custom rules: 100-200 for win, half for loss
    if (result === 'win') {
      return Math.max(100, Math.min(200, Math.abs(eloChange)));
    } else if (result === 'loss') {
      return Math.max(-100, Math.min(-50, -Math.abs(eloChange)));
    } else {
      // Draw: small change based on rating difference
      return Math.max(-25, Math.min(25, eloChange));
    }
  }

  private getKFactor(elo: number): number {
    if (elo < 1200) return 32;
    if (elo < 1800) return 24;
    return 16;
  }

  private getExpectedScore(playerElo: number, opponentElo: number): number {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }

  calculateNewElo(currentElo: number, eloChange: number): number {
    return Math.max(100, currentElo + eloChange); // Minimum ELO of 100
  }
}
