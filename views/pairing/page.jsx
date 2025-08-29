// app/pairing/page.jsx
'use client';

import { useState } from 'react';
import FoodPairingView from '@/views/pairing/FoodPairingView';

export default function FoodPairingPage() {
  const [foodForReversePairing, setFoodForReversePairing] = useState('');
  const [shoppingFood, setShoppingFood] = useState('');
  const [isLoadingReversePairing, setIsLoadingReversePairing] = useState(false);
  const [wines, setWines] = useState([]); // This would usually come from Firebase

  const handleFindWineForFood = async () => {
    setIsLoadingReversePairing(true);
    setTimeout(() => {
      alert(`Finding wine for: ${foodForReversePairing}`);
      setIsLoadingReversePairing(false);
    }, 1500);
  };
  const handleFindWineToBuy = async () => {
    setIsLoadingReversePairing(true);
    setTimeout(() => {
      alert(`Suggesting wines to buy for: ${shoppingFood}`);
      setIsLoadingReversePairing(false);
    }, 1500);
  };

  return (
    <main className="space-y-10">
      <FoodPairingView
        foodForReversePairing={foodForReversePairing}
        setFoodForReversePairing={setFoodForReversePairing}
        handleFindWineForFood={handleFindWineForFood}
        shoppingFood={shoppingFood}
        setShoppingFood={setShoppingFood}
        handleFindWineToBuy={handleFindWineToBuy}
        isLoadingReversePairing={isLoadingReversePairing}
        wines={wines}
        goToCellar={() => alert('Going to cellar')}
      />
    </main>
  );
}
