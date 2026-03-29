import React, { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { fetchVersionsManifest } from '../../services/bibleLoader';
import classes from './VersionSelector.module.css';

export default function VersionSelector() {
  const { settings, updateSettings } = useSettings();
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    fetchVersionsManifest().then(setVersions).catch(console.error);
  }, []);

  const handleChange = (e) => {
    updateSettings({ version: e.target.value });
  };

  const getLabel = (version) => {
    if (version.id === 'kjv') return 'King James';
    return version.short;
  };

  return (
    <select 
      className={classes.selector} 
      value={settings.version} 
      onChange={handleChange}
    >
      {versions.filter(v => v.available).map(v => (
        <option key={v.id} value={v.id}>
          {getLabel(v)}
        </option>
      ))}
    </select>
  );
}
