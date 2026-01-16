'use client';

import { useState, useRef, useEffect } from 'react';

interface UserInfo {
  id: string;
  name: string;
  role: 'admin' | 'adult' | 'kid';
}

interface PinModalProps {
  isOpen?: boolean;
  onSuccess: (user: UserInfo) => void;
  onCancel: () => void;
  title?: string;
}

export function PinModal({ isOpen = true, onSuccess, onCancel, title = 'Enter PIN' }: PinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError('');
      inputRefs[0].current?.focus();
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 3 && newPin.every(d => d)) {
      submitPin(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const submitPin = async (pinValue: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
      });

      if (response.ok) {
        const { userId, name, role } = await response.json();
        onSuccess({ id: userId, name, role });
      } else {
        setError('Invalid PIN');
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold text-center mb-6">{title}</h2>

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              aria-label={`PIN digit ${index + 1}`}
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm mb-4" role="alert">{error}</p>
        )}

        <button
          onClick={onCancel}
          className="w-full py-3 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
