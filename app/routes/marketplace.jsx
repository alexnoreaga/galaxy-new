import React, { useState } from 'react';

export default function Marketplace() {

    const [modal, setModal] = useState({ price: '', basePrice: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Remove commas from the input value to parse it as a number
        const rawValue = value.replace(/,/g, '');

        // Only update the state if the input value is a valid number or empty
        if (!isNaN(rawValue) || rawValue === '') {
            setModal((prev) => ({
                ...prev,
                [name]: rawValue
            }));
        }
    }

    const formatValue = (value) => {
        // Convert the raw number to a localized string with commas
        return value ? Number(value).toLocaleString() : '';
    }

    const calculateDifference = () => {
        const price = parseFloat(modal.price) || 0;
        const basePrice = parseFloat(modal.basePrice) || 0;
        return price - basePrice;
    }

    return (
      <div className="relative mx-auto sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl">
        <h1>Marketplace Fee Checker</h1>

        <input
            className="w-full mb-4"
            placeholder="Masukkan Harga Modal"
            name="price"
            value={formatValue(modal.price)}
            onChange={handleChange}
        />

        <input
            className="w-full mb-4"
            placeholder="Masukkan Base Price"
            name="basePrice"
            value={formatValue(modal.basePrice)}
            onChange={handleChange}
        />

        <h2>Cuan: {calculateDifference() !== 0 && 'Rp '}{calculateDifference().toLocaleString()}</h2>
      </div>
    );
}
