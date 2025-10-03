// Static challenge dataset (can be replaced by API later)
export const challenges = [
  {
    id: 'bitaxe-bestdiff-2025q3',
    title: 'Bitaxe Best Difficulty',
    category: 'bitaxe',
    prize: { sats: 20000 },
    start: '2025-09-01T00:00:00Z',
    end: '2025-10-01T00:00:00Z',
    status: 'finished',
    winner: {
      address: 'bc1qufq2eu72lm5axm9rwc5mdc022s7z046njf29cy',
      bestDiff: 676000000,
      paymentProof: 'https://www.blockchain.com/explorer/addresses/btc/bc1qufq2eu72lm5axm9rwc5mdc022s7z046njf29cy',
      paidAt: '2025-10-01T12:15:00Z'
    },
    summary: 'Highest single valid difficulty share submitted with a Bitaxe device wins the prize.',
    tags: ['hardware','solo','bitaxe']
  }
];

export const categoryColors = {
  bitaxe: '#d7b56d',
  lottery: '#6db5d7',
  seasonal: '#d76d9a',
  hardware: '#8ad76d'
};
