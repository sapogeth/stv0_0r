import { useState } from 'react'; // Убрал useEffect, так как он не используется
import { WALRUS_AGGREGATOR_URL } from '../services/walrus';
import { decryptData } from '../utils/crypto';

export function ProtectedPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const checkPassword = async () => {
    const blobId = localStorage.getItem('blobId');
    if (!blobId) {
      setError('Пароль не установлен. Перейдите на страницу настройки.');
      return;
    }
    try {
      const response = await fetch(`${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`);
      if (response.status === 200) {
        const storageData = await response.json();
        const decryptedData = await decryptData(
          new Uint8Array(storageData.encryptedData),
          password,
          new Uint8Array(storageData.salt),
          new Uint8Array(storageData.iv)
        );
        if (decryptedData === 'access_granted') {
          setIsAuthorized(true);
          setError(null);
        } else {
          setError('Incorrect password');
        }
      } else {
        setError('Error downloading blob');
      }
    } catch (error) {
      setError('Ошибка при загрузке или расшифровке данных');
    }
  };

  if (isAuthorized) {
    return <div>Защищённый контент здесь</div>;
  }

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
      />
      <button onClick={checkPassword}>Verify password</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}