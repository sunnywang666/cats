import { Skin } from './types';

export const BOARD_SIZE = 15;

export const RANKS = [
  "Cardboard Box",
  "Window Sill",
  "Comfy Cushion",
  "Heated Blanket",
  "Sunbeam God"
];

export const SKINS: Skin[] = [
  {
    id: 'clay',
    name: 'Classic Clay',
    description: 'Traditional matte ceramic.',
    price: 0,
    blackFill: '#44403c', // stone-700
    blackStroke: '#292524', // stone-800
    whiteFill: '#f5f5f4', // stone-100
    whiteStroke: '#a8a29e', // stone-400
  },
  {
    id: 'wood',
    name: 'Carved Wood',
    description: 'Mahogany & Birch finish.',
    price: 150,
    blackFill: '#451a03', // amber-950 (Dark Mahogany)
    blackStroke: '#78350f', // amber-900
    whiteFill: '#fde68a', // amber-200 (Light Birch)
    whiteStroke: '#b45309', // amber-700
  },
  {
    id: 'porcelain',
    name: 'Blue Porcelain',
    description: 'Fine china with blue glaze.',
    price: 300,
    blackFill: '#172554', // blue-950 (Deep Blue)
    blackStroke: '#1e3a8a', // blue-900
    whiteFill: '#ffffff', // Pure White
    whiteStroke: '#60a5fa', // blue-400
  }
];

export const LOADING_MESSAGES = [
  "Looking for a stray cat...",
  "Preparing the treats...",
  "Sharpening claws...",
  "Finding a sunny spot...",
  "Chasing a laser pointer..."
];