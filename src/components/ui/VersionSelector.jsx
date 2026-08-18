import React, { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useOfflineVersion } from '../../hooks/useOfflineVersion';
import { fetchVersionsManifest } from '../../services/bibleLoader';
import { IconChevronDown } from './Icons';
import classes from './VersionSelector.module.css';

export default function VersionSelector() {
  const { settings, updateSettings } = useSettings();
  const { isInstalled, prepareVersion, getVersionState } = useOfflineVersion();
  const [versions, setVersions] = useState([]);
  const [unavailableMessage, setUnavailableMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    fetchVersionsManifest()
      .then((list) => { if (mounted) setVersions(list); })
      .catch(console.error);
    return () => { mounted = false; };
  }, []);

  const handleChange = async (e) => {
    const nextVersion = e.target.value;
    const nextState = getVersionState(nextVersion);

    if (isInstalled && navigator.onLine === false && nextState.status !== 'ready') {
      try {
        // Una edición ya preparada puede no estar aún reflejada en el estado
        // React después de reabrir la PWA. Verifícala contra su caché durable.
        await prepareVersion(nextVersion);
        updateSettings({ version: nextVersion });
        setUnavailableMessage('');
      } catch {
        setUnavailableMessage('Se preparará al volver a tener conexión.');
      }
      return;
    }

    setUnavailableMessage('');
    updateSettings({ version: nextVersion });
    if (isInstalled) {
      prepareVersion(nextVersion).catch(() => {
        // The control keeps the selected edition readable online and retries on the next visit.
      });
    }
  };

  const availableVersions = versions.filter((version) => version.available);
  const selectedVersion = availableVersions.find((version) => version.id === settings.version);
  const offlineState = getVersionState(settings.version);
  const isPreparing = isInstalled && offlineState.status === 'downloading';
  const statusLabel = isPreparing
    ? `Preparando ${offlineState.progress}%`
    : unavailableMessage;

  return (
    <div
      className={`${classes.control} ${isPreparing ? classes.preparing : ''}`}
      style={isPreparing ? { '--offline-progress': `${offlineState.progress}%` } : undefined}
    >
      <span className={classes.copy} aria-hidden="true">
        <span className={classes.label}>Versión</span>
        <strong className={classes.current}>{selectedVersion?.short || settings.version.toUpperCase()}</strong>
      </span>
      <IconChevronDown size={16} className={classes.chevron} />
      <select
        className={classes.selector}
        value={settings.version}
        onChange={handleChange}
        aria-label="Versión de la Biblia"
        title={selectedVersion?.name || 'Seleccionar versión de la Biblia'}
      >
        {availableVersions.map((version) => (
          <option key={version.id} value={version.id}>
            {version.short} — {version.name}
          </option>
        ))}
      </select>
      <span className={classes.status} role="status" aria-live="polite">
        {statusLabel}
      </span>
    </div>
  );
}
