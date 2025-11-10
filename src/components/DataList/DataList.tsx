
import React from 'react';
import './DataList.css';

type Item = {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
};

type DataListProps = {
  items: Item[];
  columns?: 1 | 2 | 3;
};

export const DataList: React.FC<DataListProps> = ({ items, columns = 2 }) => {
  return (
    <div className={`DataList DataList--cols-${columns}`}>
      {items.map((item) => (
        <div key={item.label} className="DataList-item">
          <div className="DataList-label">{item.label}</div>
          <div className={`DataList-value ${item.muted ? 'is-muted' : ''}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};
