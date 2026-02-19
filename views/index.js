// views/index.js

export { default as CellarView } from './cellar/page';
export { default as DrinkSoonView } from './DrinkSoonView/page';
export { default as ExperiencedWinesView } from './experienced/page';
export { default as HelpView } from './help/page';
// Keep legacy export path for other views; main app imports component directly
export { default as ImportExportView } from './importExport/page';
export { default as FoodPairingView } from './pairing/page';
