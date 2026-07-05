import React, { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { fetchVersionsManifest } from '../../services/bibleLoader';
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

  return (
    <select
      className={classes.selector}
      value={settings.version}
      onChange={handleChange}
    >
      {versions.filter((v) => v.available).map((v) => (
        <option key={v.id} value={v.id}>
          {v.short}
        </option>
      ))}
    </select>
  );
}
