import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEGW } from '../../hooks/useEGW';

export default function AuthCallback() {
  const { exchangeCode, validateOAuthState } = useEGW();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code) {
      if (!validateOAuthState(state)) {
        alert('No se pudo validar la sesión de autenticación. Intenta nuevamente.');
        navigate('/');
        return;
      }

      exchangeCode(code)
        .then((success) => {
          if (success) {
            navigate('/');
          } else {
            alert('Hubo un error autenticando con EGW Writings');
            navigate('/');
          }
        })
        .catch((err) => {
          console.error('Error en callback de autenticación:', err);
          alert('No fue posible completar la autenticación con EGW Writings');
          navigate('/');
        });
    } else {
      navigate('/');
    }
  }, [location, exchangeCode, navigate, validateOAuthState]);

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Inter' }}>
      <h2>Conectando cuenta EGW...</h2>
      <p>Espera mientras autorizamos el acceso.</p>
    </div>
  );
}
