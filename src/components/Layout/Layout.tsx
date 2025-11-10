
import React from 'react';
import './Layout.css';

type LayoutProps = {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({ sidebar, header, children }) => {
  return (
    <div className="layout">
      <aside className="layout-sidebar">
        {sidebar}
      </aside>
      <main className="layout-main">
        <header className="layout-header">
          {header}
        </header>
        <section className="layout-content">
          {children}
        </section>
      </main>
    </div>
  );
};
