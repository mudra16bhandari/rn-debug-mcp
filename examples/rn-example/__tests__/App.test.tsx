import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { Button } from 'react-native';

test('renders correctly and simulates activity', async () => {
  let renderer: any;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });

  // Find the button and press it a few times
  const button = renderer.root.findByType(Button);

  for (let i = 0; i < 5; i++) {
    await ReactTestRenderer.act(async () => {
      button.props.onPress();
    });
    // Wait a bit to avoid deduplication if needed, 
    // though the server might handle it.
    await new Promise(resolve => setTimeout(() => resolve(undefined), 50));
  }

  // Wait for events to be sent
  await new Promise(resolve => setTimeout(() => resolve(undefined), 500));
});
