import React, { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { fetchVersionsManifest } from '../../services/bibleLoader';
import { IconChevronDown } from './Icons';
import classes from './VersionSelector.module.css';

export default function VersionSelector() {
  const { settings, updateSettings } = useSettings();
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchVersionsManifest()
      .then((list) => { if (mounted) setVersions(list); })
      .catch(console.error);
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    updateSettings({ version: e.target.value });
  };

  const availableVersions = versions.filter((version) => version.available);
  const selectedVersion = availableVersions.find((version) => version.id === settings.version);

  return (
    <div className={classes.control}>
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
    </div>
  );
}
