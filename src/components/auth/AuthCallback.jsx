import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEGW } from '../../hooks/useEGW';

export default function AuthCallback() {
  const { exchangeCode } = useEGW();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      exchangeCode(code).then((success) => {
        if (success) {
          navigate('/');
        } else {
          alert('Hubo un error autenticando con EGW Writings');
          navigate('/');
        }
      });
    } else {
      navigate('/');
    }
  }, [location, exchangeCode, navigate]);

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Inter' }}>
      <h2>Conectando cuenta EGW...</h2>
      <p>Espera mientras autorizamos el acceso.</p>
    </div>
  );
}
