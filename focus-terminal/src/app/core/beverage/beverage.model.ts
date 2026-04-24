export interface BeverageType {
  id: string;
  name: string;
  imagePath: string;
  color: string;
  icon: string;
}

export const BEVERAGES: Record<string, BeverageType> = {
  coffee: {
    id: 'coffee',
    name: 'Coffee',
    imagePath: '/coffee.jpg',
    color: '#8B4513',
    icon: '☕'
  },
  monster: {
    id: 'monster',
    name: 'Monster',
    imagePath: '/monster.webp',
    color: '#00FF00',
    icon: '⚡'
  },
  redbull: {
    id: 'redbull',
    name: 'Red Bull',
    imagePath: '/redbull.jpg',
    color: '#0066FF',
    icon: '🐂'
  }
};