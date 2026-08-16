import React from 'react';
import { IconHeart } from '../ui/Icons';
import classes from './SiteFooter.module.css';

const MERCADO_PAGO_URL = 'https://link.mercadopago.cl/jsilvacoder';
const PAYPAL_URL = 'https://paypal.me/jsilvacode';
const CONTACT_EMAIL = 'jsilvacode@gmail.com';

export default function SiteFooter() {
  return (
    <footer className={classes.footer}>
      <section id="donar" className={classes.support} tabIndex="-1">
        <span className={classes.supportEyebrow}>Una Biblia abierta para todos</span>
        <div className={classes.supportHeading}>
          <span className={classes.supportIcon} aria-hidden="true"><IconHeart size={21} /></span>
          <h3 className={classes.supportTitle}>Apoya el proyecto</h3>
        </div>
        <p className={classes.supportText}>
          Este proyecto es gratuito y sin anuncios. Tu donación ayuda a mantener
          los servidores y el desarrollo.
        </p>
        <div className={classes.donationActions}>
          <a href={MERCADO_PAGO_URL} target="_blank" rel="noopener noreferrer" className={classes.mpBtn}>
            <span>Mercado Pago</span>
            <small>Donar de forma segura</small>
          </a>
          <a href={PAYPAL_URL} target="_blank" rel="noopener noreferrer" className={classes.ppBtn}>
            <span>PayPal</span>
            <small>Apoyar con PayPal</small>
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
