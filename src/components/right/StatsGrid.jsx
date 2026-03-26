import { useRef, useEffect } from 'react';
import Sortable from 'sortablejs';
import { useLang } from '../../context/LangContext';

const STORAGE_KEY = 'statsOrder';
const DEFAULT_ORDER = ['time', 'dist', 'avgSplit', 'avgRate', 'mps', 'curSplit'];

function loadOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length === 6) return saved;
  } catch {}
  return DEFAULT_ORDER;
}

function applyBorderClasses(list) {
  const items = list.querySelectorAll('.stat');
  items.forEach((el, i) => {
    el.classList.toggle('no-right', i % 2 === 1);
    el.classList.toggle('no-bottom', i >= 4);
  });
}

export default function StatsGrid({ time, dist, distUnit, avgSplit, avgRate, mps, curSplit }) {
  const { t } = useLang();
  const listRef = useRef(null);
  const orderRef = useRef(loadOrder());

  const stats = {
    time: { val: time, lbl: t('time') },
    dist: { val: <>{dist}<span className="unit">{distUnit}</span></>, lbl: t('dist') },
    avgSplit: { val: avgSplit, lbl: t('avgSplit') },
    avgRate: { val: avgRate, lbl: t('avgRate') },
    mps: { val: <>{mps}<span className="unit"> m</span></>, lbl: t('mps') },
    curSplit: { val: curSplit, lbl: t('splitLbl') },
  };

  useEffect(() => {
    if (!listRef.current) return;
    applyBorderClasses(listRef.current);

    const sortable = Sortable.create(listRef.current, {
      animation: 150,
      onEnd() {
        const newOrder = [...listRef.current.querySelectorAll('.stat')].map(el => el.dataset.key);
        orderRef.current = newOrder;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
        applyBorderClasses(listRef.current);
      },
    });

    return () => sortable.destroy();
  }, []);

  return (
    <div className="stats-list" ref={listRef}>
      {orderRef.current.map(key => {
        const s = stats[key];
        return (
          <div className="stat" key={key} data-key={key}>
            <div className="stat-val">{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        );
      })}
    </div>
  );
}
