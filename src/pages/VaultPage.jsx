import React, { useState } from 'react';
import { useCredentials } from '@hooks/useCredentials';
import { useAuth } from '@hooks/useAuth';
import './VaultPage.css';

export const VaultPage = () => {
  const { user, logout } = useAuth();
  const {
    filteredCredentials,
    search,
    searchQuery,
    toggleFavorite,
    sync,
  } = useCredentials();

  // Tabs: 'passwords', 'folders', 'generator', 'settings'
  const [activeTab, setActiveTab] = useState('passwords');

  // Generator local state
  const [genLen, setGenLen] = useState(16);
  const [generatedPass, setGeneratedPass] = useState('vQ8#mK9$xL2@pW5!');
  const [copiedId, setCopiedId] = useState(null);

  // Settings state matching Image 2
  const [lockTimer, setLockTimer] = useState('30 Minutes');

  // Generate random premium password
  const handleGenerate = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let res = '';
    for (let i = 0; i < genLen; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPass(res);
  };

  // Simulated copy feedback
  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  // Reusable Auto-fill & Login trigger
  const handleAutoFillAndLogin = (cred) => {
    let targetUrl = cred.url || cred.domain;
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'http://' + targetUrl;
    }

    const payloadMsg = {
      type: 'INJECT_CREDENTIALS',
      payload: {
        ...cred,
        autoSubmit: true,
        targetUrl: targetUrl,
      },
    };

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs.length > 0) {
            const currentTabId = tabs[0].id;
            const currentUrl = tabs[0].url || '';

            // Zoho Vault Core Concept Extraction:
            // Compare the destination site against the currently active site window.
            // If the user is already viewing the target site, skip page reloads entirely
            // and trigger inline auto-fill injection on the matching live DOM elements instantly!
            const extractHostAndPort = (url) => {
              if (!url) return { host: '', port: '' };
              const clean = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
              const parts = clean.split(':');
              return {
                host: parts[0],
                port: parts.length > 1 ? parts[1] : ''
              };
            };

            const targetParsed = extractHostAndPort(targetUrl);
            const currentParsed = extractHostAndPort(currentUrl);

            const isSameSite = targetParsed.host && currentParsed.host &&
                               targetParsed.host === currentParsed.host && 
                               (targetParsed.port === currentParsed.port || !targetParsed.port || !currentParsed.port);

            if (isSameSite) {
              console.log('Zoho Vault concept matched: already on target domain. Injecting live DOM directly.');
              chrome.tabs.sendMessage(currentTabId, {
                type: 'INJECT_CREDENTIALS',
                payload: {
                  credentialId: cred.id,
                  username: cred.username,
                  password: cred.password,
                  autoSubmit: true
                }
              }).catch(() => {});
            } else {
              // Target is different from current window: queue background injection and route tab
              if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage(payloadMsg).catch(() => {});
              }
              chrome.tabs.update(currentTabId, { url: targetUrl });
            }
          } else {
            window.location.href = targetUrl;
          }
        });
      } else {
        // Full local UI verification simulation
        alert(`[Automated Auto-fill & Login Executed]\n\n• Target Site: ${targetUrl} (Opening in current tab)\n• User ID Injecting: "${cred.username}"\n• Access Code Injecting: "${cred.password}"\n\nAutomatically submitting login sequence...`);
        window.location.href = targetUrl;
      }
    } catch (err) {
      console.error(err);
      window.location.href = targetUrl;
    }
  };

  return (

    <div className="dashboard-container">
      {/* Premium Blue Header Strip */}
      <header className="dashboard-header">
        <div className="header-top">
          {/* Top Left Logo Icon Button */}
          <div className="header-logo" title="VaultGuard Home">
            <span className="logo-symbol">*</span>
          </div>

          {/* Integrated Search Input Strip */}
          <div className="header-search-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="header-search-input"
              placeholder="Search"
              value={searchQuery || ''}
              onChange={(e) => search(e.target.value)}
            />
          </div>

          {/* Right Area: Browser Tab Count Badge & User Profile Avatar */}
          <div className="header-actions">
            <div className="browser-badge-icon" title="Active Page Auto-fill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 8h20M6 4v4" />
              </svg>
              <span className="badge-count">0</span>
            </div>
            <div className="user-avatar" title={user?.email || 'Profile'}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Avatar"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="avatar-fallback">{user?.name?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Strip */}
        <nav className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'passwords' ? 'active' : ''}`}
            onClick={() => setActiveTab('passwords')}
          >
            Passwords
          </button>
          <button
            className={`tab-btn ${activeTab === 'folders' ? 'active' : ''}`}
            onClick={() => setActiveTab('folders')}
          >
            Folders
          </button>
          <button
            className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('generator');
              handleGenerate();
            }}
          >
            Generator
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      {/* Main Container Area */}
      <main className="dashboard-content">
        {/* TAB 1: PASSWORDS (Matching Image 3) */}
        {activeTab === 'passwords' && (
          <div className="tab-pane passwords-pane">
            <div className="section-header">
              <h2 className="section-title">All Passwords</h2>
              <div className="section-actions">
                <button className="icon-action-btn" onClick={sync} title="Refresh Vault">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                  </svg>
                </button>
                <button
                  className="icon-action-btn"
                  onClick={() => alert('Add feature activated')}
                  title="Add Password"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <button className="icon-action-btn" title="Filter list">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="credentials-list">
              {filteredCredentials.length === 0 ? (
                <div className="empty-message">No matching credentials found</div>
              ) : (
                filteredCredentials.map((cred) => (
                  <div
                    className="credential-row"
                    key={cred.id}
                    onClick={() => handleAutoFillAndLogin(cred)}
                    title={`Click to open link and auto-login as ${cred.username}`}
                  >
                    {/* Star Favorite Toggle Button */}
                    <button
                      className={`star-btn ${cred.isFavorite ? 'favorite' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(cred.id);
                      }}
                      title={cred.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg viewBox="0 0 24 24" fill={cred.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>

                    {/* Rich Avatar Render */}
                    <div className="row-avatar" style={{ backgroundColor: cred.avatarBg || '#3b82f6' }}>
                      {cred.avatarIcon === 'coursera' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" className="custom-icon">
                          <path d="M8 10c-2 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3-1.5-3-3-3zm8 0c-2 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3-1.5-3-3-3z" />
                        </svg>
                      ) : cred.avatarIcon === 'indexer' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" className="custom-icon">
                          <circle cx="12" cy="6" r="3" fill="#f43f5e" />
                          <circle cx="6" cy="18" r="3" fill="#3b82f6" />
                          <circle cx="18" cy="18" r="3" fill="#eab308" />
                          <path d="M10 9l-2 6M14 9l2 6M8 18h8" stroke="#94a3b8" />
                        </svg>
                      ) : cred.avatarIcon === 'bsnl' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" className="custom-icon">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      ) : (
                        <span className="avatar-char">{cred.avatarLetter || cred.name.charAt(0)}</span>
                      )}
                    </div>

                    {/* Metadata Content */}
                    <div className="row-info">
                      <div className="row-title">{cred.name}</div>
                      <div className="row-subtitle">
                        <button
                          className="inline-copy-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(cred.username, `user_${cred.id}`);
                          }}
                          title="Copy username"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ stroke: '#64748b' }}>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        </button>
                        <span className="username-text">
                          {copiedId === `user_${cred.id}` ? 'Copied!' : cred.username}
                        </span>
                      </div>
                    </div>

                    {/* Hover Actions Strips & Chevron Right */}
                    <div className="row-hover-actions">
                      {/* 1. Copy Password Trigger */}
                      <div className="action-btn-wrapper">
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(cred.password || 'password123', `pass_${cred.id}`);
                          }}
                          aria-label="Copy password"
                        >
                          <i className="bi bi-clipboard fa fa-copy"></i>
                          <span className="action-symbol">📋</span>
                        </button>
                        <span className="custom-tooltip">
                          {copiedId === `pass_${cred.id}` ? 'Copied Password!' : 'Copy Password'}
                        </span>
                      </div>

                      {/* 2. Automated Auto-fill & Login Trigger */}
                      <div className="action-btn-wrapper">
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAutoFillAndLogin(cred);
                          }}
                          aria-label="Auto-fill and log in"
                        >
                          <i className="bi bi-box-arrow-in-right fa fa-sign-in"></i>
                          <span className="action-symbol">🚀</span>
                        </button>
                        <span className="custom-tooltip">Auto-fill & Log In</span>
                      </div>

                      {/* 3. More Options Menu */}
                      <div className="action-btn-wrapper">
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Options menu for ${cred.name}`);
                          }}
                          aria-label="More options"
                        >
                          <i className="bi bi-three-dots fa fa-ellipsis-v"></i>
                          <span className="action-symbol" style={{ fontWeight: 'bold', fontSize: '15px' }}>⋮</span>
                        </button>
                        <span className="custom-tooltip">More Options</span>
                      </div>
                    </div>


                    <div className="chevron-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                ))

              )}
            </div>
          </div>
        )}

        {/* TAB 2: FOLDERS */}
        {activeTab === 'folders' && (
          <div className="tab-pane folders-pane">
            <div className="section-header">
              <h2 className="section-title">Vault Folders</h2>
              <button className="icon-action-btn" title="Add Folder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
            <div className="folders-grid">
              {[
                { name: 'Work / Enterprise', count: 8, bg: '#eff6ff', color: '#2563eb' },
                { name: 'Personal Accounts', count: 12, bg: '#fef3c7', color: '#d97706' },
                { name: 'Finance & Banking', count: 4, bg: '#ecfdf5', color: '#059669' },
                { name: 'Social Media', count: 6, bg: '#fce7f3', color: '#db2777' },
              ].map((f, i) => (
                <div className="folder-card" key={i}>
                  <div className="folder-icon" style={{ backgroundColor: f.bg, color: f.color }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div className="folder-details">
                    <div className="folder-name">{f.name}</div>
                    <div className="folder-count">{f.count} items</div>
                  </div>
                  <svg className="folder-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GENERATOR */}
        {activeTab === 'generator' && (
          <div className="tab-pane generator-pane">
            <div className="section-header">
              <h2 className="section-title">Password Generator</h2>
            </div>
            <div className="generator-card">
              <div className="gen-display-box">
                <span className="gen-pass-string">{generatedPass}</span>
                <button
                  className="gen-copy-btn"
                  onClick={() => handleCopy(generatedPass, 'gen')}
                  title="Copy password"
                >
                  {copiedId === 'gen' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="gen-controls">
                <div className="slider-header">
                  <label>Password Length</label>
                  <span className="len-badge">{genLen}</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={genLen}
                  onChange={(e) => {
                    setGenLen(Number(e.target.value));
                    handleGenerate();
                  }}
                  className="len-slider"
                />

                <div className="gen-options">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked disabled /> Uppercase (A-Z)
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked disabled /> Numbers (0-9)
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked disabled /> Special Symbols (!@#$)
                  </label>
                </div>

                <button className="generate-trigger-btn" onClick={handleGenerate}>
                  Generate New Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS (Matching Image 2 precisely) */}
        {activeTab === 'settings' && (
          <div className="tab-pane settings-pane">
            <div className="section-header">
              <h2 className="section-title">Settings</h2>
              <button className="icon-action-btn" title="Refresh Settings">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              </button>
            </div>

            <div className="settings-form">
              <div className="form-group-item">
                <label className="setting-label">Lock extension after</label>
                <div className="custom-select-wrapper">
                  <select
                    className="setting-select"
                    value={lockTimer}
                    onChange={(e) => setLockTimer(e.target.value)}
                  >
                    <option>15 Minutes</option>
                    <option>30 Minutes</option>
                    <option>1 Hour</option>
                    <option>Never</option>
                  </select>
                </div>
              </div>

              <div className="account-card-box">
                <div className="acc-info">
                  <span className="acc-label">Signed in as</span>
                  <strong className="acc-email">{user?.email || 'demo@vaultguard.com'}</strong>
                </div>
                <button className="settings-logout-btn" onClick={logout}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

