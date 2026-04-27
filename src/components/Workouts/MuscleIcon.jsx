import React from 'react';
import Model from 'react-body-highlighter';

const DAY_MUSCLES = {
  'chest-biceps': {
    front: [
      { name: 'Chest', muscles: ['chest'] },
      { name: 'Biceps', muscles: ['biceps'] },
    ],
  },
  back: {
    back: [{ name: 'Back', muscles: ['upper-back', 'lower-back', 'trapezius'] }],
  },
  'ham-glutes': {
    back: [{ name: 'Posterior', muscles: ['hamstring', 'gluteal'] }],
  },
  'shoulders-tri': {
    front: [
      { name: 'Shoulders', muscles: ['front-deltoids'] },
      { name: 'Triceps', muscles: ['triceps'] },
    ],
  },
  quads: {
    front: [{ name: 'Quads', muscles: ['quadriceps'] }],
  },
  push: {
    front: [
      { name: 'Chest', muscles: ['chest'] },
      { name: 'Shoulders', muscles: ['front-deltoids'] },
      { name: 'Triceps', muscles: ['triceps'] },
    ],
  },
  pull: {
    back: [
      { name: 'Back', muscles: ['upper-back', 'lower-back', 'trapezius'] },
      { name: 'Biceps', muscles: ['biceps'] },
    ],
  },
  legs: {
    front: [{ name: 'Legs', muscles: ['quadriceps', 'hamstring', 'gluteal'] }],
  },
};

export default function MuscleIcon({ dayId }) {
  const config = DAY_MUSCLES[dayId];
  if (!config) return null;

  const isFront = !!config.front;
  const data = config.front || config.back;

  return (
    <Model
      data={data}
      style={{ width: '60px', height: 'auto', flexShrink: 0 }}
      type={isFront ? 'anterior' : 'posterior'}
      highlightedColors={['#c8f135']}
      bodyColor="var(--border)"
      skinColor="var(--surface)"
    />
  );
}
