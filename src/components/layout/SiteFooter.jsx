import React from 'react';
import classes from './SiteFooter.module.css';

const MERCADO_PAGO_URL = 'https://link.mercadopago.cl/jsilvacoder';
const PAYPAL_URL = 'https://paypal.me/jsilvacode';
const CONTACT_EMAIL = 'jsilvacode@gmail.com';

export default function SiteFooter() {
  return (
    <footer className={classes.footer}>
      <section className={classes.support}>
        <h3 className={classes.supportTitle}>Apoya el proyecto</h3>
        <p className={classes.supportText}>
          Este proyecto es gratuito y sin anuncios. Tu donación ayuda a mantener
          los servidores y el desarrollo.
        </p>
        <div className={classes.donationActions}>
          <a href={MERCADO_PAGO_URL} target="_blank" rel="noopener noreferrer" className={classes.mpBtn}>
            Mercado Pago
          </a>
          <a href={PAYPAL_URL} target="_blank" rel="noopener noreferrer" className={classes.ppBtn}>
            PayPal
          </a>
        </div>
      </section>

      <div className={classes.copy}>
        <p className={classes.appName}>Santa Biblia v2.1</p>
        <p>Desarrollada por Julio Silva</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className={classes.email}>{CONTACT_EMAIL}</a>
      </div>
    </footer>
  );
}
