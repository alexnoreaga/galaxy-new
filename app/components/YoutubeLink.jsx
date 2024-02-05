import React from 'react';
import { ExternalVideo } from '@shopify/hydrogen';

export const YoutubeLink = () => {
  // Assuming ExternalVideo is a component that expects options
  const videoOptions = {
    id: 'uniqueVideoId',  // Replace with a valid ID
    embedUrl: 'https://www.youtube.com/embed/gduMZjDVQN4',
    host: 'YOUTUBE',  // or 'VIMEO' based on the video host
    mediaContentType: 'EXTERNAL_VIDEO',
    originUrl: 'https://www.youtube.com/embed/gduMZjDVQN4',
    mediaErrors: [],  // Provide an empty array or populate it based on your needs
    mediaWarnings: [],  // Provide an empty array or populate it based on your needs
    status: 'READY',  // Set the status based on your needs, e.g., 'READY'
    // Add other required options based on documentation
  };

  return (
    <div>
      {/* <ExternalVideo options={{ data: videoOptions }} /> */}
    </div>
  );
};