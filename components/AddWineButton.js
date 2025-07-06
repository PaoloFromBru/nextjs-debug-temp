'use client';

import React from 'react';

// Button to trigger adding a new wine; onAdd should open a modal or perform the add action
const AddWineButton = ({ onAdd }) => {
  return (
    <button
      // Wrap onAdd in an arrow to prevent passing the click event directly
      onClick={() => onAdd()}
      className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition"
    >
      Add New Wine
    </button>
  );
};

export default AddWineButton;
