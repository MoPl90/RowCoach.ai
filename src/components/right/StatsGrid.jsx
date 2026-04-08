import { useRef, useEffect, useState } from 'react';
import Sortable from 'sortablejs';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { useLang } from '../../context/LangContext';

const STORAGE_KEY = 'statsOrder';
const LAYOUT_KEY = 'statsLayout';

const ALL_TILES = [
  { key: 'time',     lbl: 'time' },
  { key: 'dist',     lbl: 'dist' },
  { key: 'curRate',  lbl: 'curRate' },
  { key: 'avgRate',  lbl: 'avgRate' },
  { key: 'curSplit', lbl: 'splitLbl' },
  { key: 'avgSplit', lbl: 'avgSplit' },
  { key: 'curMps',   lbl: 'curMps' },
  { key: 'avgMps',   lbl: 'avgMps' },
];
const DEFAULT_KEYS = ['time', 'dist', 'curRate', 'avgRate', 'curSplit', 'avgSplit'];
const DEFAULT_LAYOUT = { cols: 2, rows: 3 };

const LAYOUTS = [
  { cols: 1, rows: 2 },
  { cols: 2, rows: 1 },
  { cols: 1, rows: 3 },
  { cols: 2, rows: 2 },
  { cols: 2, rows: 3 },
  { cols: 2, rows: 4 },
];

function loadKeys() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch {}
  return DEFAULT_KEYS;
}

function loadLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY));
    if (saved && typeof saved.cols === 'number') return saved;
  } catch {}
  return DEFAULT_LAYOUT;
}

function applyBorderClasses(items, cols) {
  const count = items.length;
  items.forEach((el, i) => {
    el.classList.toggle('no-right', (i + 1) % cols === 0);
    el.classList.toggle('no-bottom', i + cols >= count);
  });
}

export default function StatsGrid({ time, dist, distUnit, curSplit, avgSplit, curRate, avgRate, curMps, avgMps, onToggleMode }) {
  const { t } = useLang();
  const listRef = useRef(null);
  const trashRef = useRef(null);
  const addChipsRef = useRef(null);
  const draggedRef = useRef(false);

  const [activeKeys, setActiveKeys] = useState(loadKeys);
  const [layout, setLayout] = useState(loadLayout);
  const [isDragging, setIsDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  const stats = {
    time:     { val: time,    lbl: t('time') },
    dist:     { val: <>{dist}<span className="unit">{distUnit}</span></>, lbl: t('dist') },
    curRate:  { val: curRate, lbl: t('curRate') },
    avgRate:  { val: avgRate, lbl: t('avgRate') },
    curSplit: { val: curSplit, lbl: t('splitLbl') },
    avgSplit: { val: avgSplit, lbl: t('avgSplit') },
    curMps:   { val: <>{curMps}<span className="unit"> m</span></>, lbl: t('curMps') },
    avgMps:   { val: <>{avgMps}<span className="unit"> m</span></>, lbl: t('avgMps') },
  };

  const maxTiles = layout.cols * layout.rows;
  const visibleKeys = activeKeys.slice(0, maxTiles);
  const inactiveTiles = ALL_TILES.filter(tile => !activeKeys.includes(tile.key));
  const gridFull = activeKeys.length >= maxTiles;

  // Close panels on outside click
  useEffect(() => {
    if (!showSettings && !showAddPanel) return;
    function close() { setShowSettings(false); setShowAddPanel(false); }
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [showSettings, showAddPanel]);

  // Apply border classes after every render
  useEffect(() => {
    if (!listRef.current) return;
    applyBorderClasses([...listRef.current.querySelectorAll('.stat')], layout.cols);
  });

  // Track pointer position during drag to highlight trash zone
  useEffect(() => {
    if (!isDragging) return;
    function onMove(e) {
      if (!trashRef.current) return;
      const touch = e.touches?.[0];
      const x = touch ? touch.clientX : e.clientX;
      const y = touch ? touch.clientY : e.clientY;
      const r = trashRef.current.getBoundingClientRect();
      setOverTrash(x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
    }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('touchmove', onMove);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('touchmove', onMove);
      setOverTrash(false);
    };
  }, [isDragging]);

  // Chips Sortable — drag from add panel into the grid
  useEffect(() => {
    if (!showAddPanel || !addChipsRef.current) return;
    const sortable = Sortable.create(addChipsRef.current, {
      group: { name: 'tiles', pull: 'clone', put: false },
      sort: false,
      animation: 150,
    });
    return () => sortable.destroy();
  }, [showAddPanel]);

  // Stats-list Sortable
  useEffect(() => {
    if (!listRef.current) return;

    const sortable = Sortable.create(listRef.current, {
      group: 'tiles',
      animation: 150,
      onStart() { setIsDragging(true); },
      onMove(evt) {
        // Block drop from chips if grid is already full
        if (evt.from !== listRef.current && activeKeys.length >= maxTiles) return false;
      },
      onAdd(evt) {
        // Chip dragged from add panel into the grid
        const key = evt.item.dataset.key;
        const idx = evt.newIndex;
        evt.item.remove(); // React will re-render the real tile
        const newVisible = [...activeKeys.slice(0, maxTiles)];
        newVisible.splice(idx, 0, key);
        const newActive = [...newVisible, ...activeKeys.slice(maxTiles)];
        setActiveKeys(newActive);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newActive));
        setShowAddPanel(false);
      },
      onEnd(evt) {
        setIsDragging(false);
        if (evt.from !== listRef.current) return; // handled by onAdd

        draggedRef.current = true;
        const oe = evt.originalEvent;
        const x = oe?.clientX ?? oe?.changedTouches?.[0]?.clientX;
        const y = oe?.clientY ?? oe?.changedTouches?.[0]?.clientY;

        const droppedOnTrash = (() => {
          if (!trashRef.current || x == null || y == null) return false;
          const r = trashRef.current.getBoundingClientRect();
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        })();

        const reorderedVisible = [...listRef.current.querySelectorAll('.stat')].map(el => el.dataset.key);
        const newActive = droppedOnTrash
          ? activeKeys.filter(k => k !== evt.item.dataset.key)
          : [...reorderedVisible, ...activeKeys.slice(maxTiles)];

        setActiveKeys(newActive);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newActive));
      },
    });

    return () => sortable.destroy();
  }, [activeKeys, layout]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTitleClick() {
    if (draggedRef.current) { draggedRef.current = false; return; }
    setShowSettings(false);
    setShowAddPanel(false);
    onToggleMode?.();
  }

  function handleLayoutChange(newLayout) {
    setLayout(newLayout);
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(newLayout));
  }

  function handleAddTile(key) {
    if (gridFull) return;
    const newKeys = [...activeKeys, key];
    setActiveKeys(newKeys);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newKeys));
  }

  function handleRestoreDefaults() {
    setActiveKeys(DEFAULT_KEYS);
    setLayout(DEFAULT_LAYOUT);
    setShowSettings(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_KEYS));
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(DEFAULT_LAYOUT));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Header */}
      <div className="stats-hdr">
        <div style={{ cursor: 'pointer' }} onClick={handleTitleClick}>
          <span>{t('statsHdr')}</span>{' '}
          <span style={{ color: 'var(--g3)', fontSize: '.4rem', letterSpacing: '.05em' }}>{t('tap')}</span>
        </div>
        <div className="stats-hdr-icons">
          <button
            className="icon-btn"
            onPointerDown={e => e.stopPropagation()}
            onClick={() => { setShowAddPanel(v => !v); setShowSettings(false); }}
          ><Plus size={14} strokeWidth={2.5} /></button>
          <button
            className="icon-btn"
            onPointerDown={e => e.stopPropagation()}
            onClick={() => { setShowSettings(v => !v); setShowAddPanel(false); }}
          ><Settings size={14} strokeWidth={2} /></button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="stats-panel" onPointerDown={e => e.stopPropagation()}>
          <div className="layout-opts">
            {LAYOUTS.map(({ cols, rows }) => (
              <div
                key={`${cols}x${rows}`}
                className={`layout-opt${layout.cols === cols && layout.rows === rows ? ' active' : ''}`}
                style={{ gridTemplateColumns: `repeat(${cols}, 8px)`, gridTemplateRows: `repeat(${rows}, 8px)` }}
                onClick={() => handleLayoutChange({ cols, rows })}
              >
                {Array.from({ length: cols * rows }).map((_, i) => (
                  <div key={i} className="layout-opt-cell" />
                ))}
              </div>
            ))}
          </div>
          <button className="restore-btn" onClick={handleRestoreDefaults}>
            {t('restoreDefaults')}
          </button>
        </div>
      )}

      {/* Add panel */}
      {showAddPanel && (
        <div className="stats-panel" onPointerDown={e => e.stopPropagation()}>
          {inactiveTiles.length === 0 ? (
            <span style={{ color: 'var(--g3)', fontSize: '.5rem', fontFamily: 'var(--fontb)' }}>—</span>
          ) : (
            <div className="add-chips" ref={addChipsRef}>
              {inactiveTiles.map(({ key, lbl }) => (
                <div
                  key={key}
                  className={`add-chip${gridFull ? ' disabled' : ''}`}
                  data-key={key}
                  onClick={() => handleAddTile(key)}
                >
                  {t(lbl)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tile grid */}
      <div
        className="stats-list"
        ref={listRef}
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
        }}
      >
        {visibleKeys.map(key => {
          const s = stats[key];
          if (!s) return null;
          return (
            <div className="stat" key={key} data-key={key}>
              <div className="stat-val">{s.val}</div>
              <div className="stat-lbl">{s.lbl}</div>
            </div>
          );
        })}
      </div>

      {/* Drag-to-delete trash zone */}
      {isDragging && (
        <div ref={trashRef} className={`stat-trash-zone${overTrash ? ' over' : ''}`}>
          <Trash2 size={22} strokeWidth={1.8} />
        </div>
      )}
    </div>
  );
}
