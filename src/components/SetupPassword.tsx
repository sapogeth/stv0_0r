import React, { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit'; // Если нужен аккаунт
import { WALRUS_PUBLISHER_URL } from '../services/walrus';
import { encryptData, EncryptedData } from '../utils/crypto';

export const SetupPassword: React.FC = () => {
  const currentAccount = useCurrentAccount(); // Добавлено, если требуется
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSetup = async () => {
    if (!password) {
      setMessage('Пожалуйста, введите пароль');
      return;
    }

    const dataToEncrypt = "access_granted";
    const { encryptedData, salt, iv }: EncryptedData = await encryptData(dataToEncrypt, password);
    const storageData = {
      encryptedData: Array.from(encryptedData),
      salt: Array.from(salt),
      iv: Array.from(iv),
    };

    try {
      const response = await fetch(`${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }, // Добавлено для JSON
        body: JSON.stringify(storageData),
      });

      if (response.status === 200) {
        const info = await response.json();
        const blobId = info.newlyCreated?.blobObject?.blobId || info.alreadyCertified?.blobId;
        if (blobId) {
          localStorage.setItem('blobId', blobId);
          setMessage('Пароль успешно установлен!');
        } else {
          throw new Error('Не удалось получить blobId из ответа');
        }
      } else {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    } catch (error) {
      console.error('Error details:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        localStorage.setItem('encryptedPassword', btoa(JSON.stringify(storageData)));
        setMessage('Сервер Walrus недоступен. Пароль сохранён локально как резерв.');
      } else {
        setMessage(`Произошла ошибка: ${error.message}`);
      }
    }
  };

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Введите новый пароль"
      />
      <button onClick={handleSetup} disabled={!currentAccount}>
        Установить пароль
      </button>
      {message && (
        <div style={{ color: message.includes('Ошибка') ? 'red' : 'green' }}>
          {message}
        </div>
      )}
    </div>
  );
};