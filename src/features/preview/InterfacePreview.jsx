import React from "react";
import {
  Bell,
  LayoutDashboard,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

function InterfacePreview({ roles, primaryText }) {
  const previewStyles = {
    "--preview-background": roles.background,
    "--preview-surface": roles.surface,
    "--preview-text": roles.text,
    "--preview-primary": roles.primary,
    "--preview-accent": roles.accent,
    "--preview-primary-text": primaryText,
  };

  return (
    <>
      <div className="ui-preview-canvas__heading">
        <div>
          <span>Dashboard example</span>
          <strong>Live interface</strong>
        </div>
        <div className="ui-preview-canvas__status">
          <span />
          Live preview
        </div>
      </div>

      <div className="preview-application" style={previewStyles}>
        <aside className="preview-sidebar">
          <div className="preview-brand">
            <span>
              <Sparkles size={17} aria-hidden="true" />
            </span>
            <strong>Northstar</strong>
          </div>

          <nav>
            <button className="preview-nav-item preview-nav-item--active" type="button">
              <LayoutDashboard size={17} aria-hidden="true" />
              Overview
            </button>
            <button className="preview-nav-item" type="button">
              <TrendingUp size={17} aria-hidden="true" />
              Analytics
            </button>
            <button className="preview-nav-item" type="button">
              <Users size={17} aria-hidden="true" />
              Customers
            </button>
          </nav>

          <div className="preview-sidebar__card">
            <Sparkles size={18} aria-hidden="true" />
            <strong>Upgrade plan</strong>
            <span>Unlock advanced reports.</span>
            <button type="button">View plans</button>
          </div>
        </aside>

        <div className="preview-content">
          <header className="preview-topbar">
            <div className="preview-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search dashboard"
                readOnly
                aria-label="Search dashboard preview"
              />
            </div>
            <button className="preview-icon-button" type="button" aria-label="Notifications">
              <Bell size={17} aria-hidden="true" />
            </button>
            <span className="preview-avatar">CL</span>
          </header>

          <div className="preview-main">
            <div className="preview-main__heading">
              <div>
                <span>September overview</span>
                <h2>Welcome back, Cristina</h2>
              </div>
              <button className="preview-primary-button" type="button">
                Create report
              </button>
            </div>

            <div className="preview-stat-grid">
              <article className="preview-stat-card">
                <div>
                  <span>Total revenue</span>
                  <TrendingUp size={17} aria-hidden="true" />
                </div>
                <strong>$48,290</strong>
                <small>+12.5% from last month</small>
              </article>
              <article className="preview-stat-card">
                <div>
                  <span>New customers</span>
                  <Users size={17} aria-hidden="true" />
                </div>
                <strong>1,429</strong>
                <small>+8.2% from last month</small>
              </article>
              <article className="preview-stat-card">
                <div>
                  <span>Conversion</span>
                  <Sparkles size={17} aria-hidden="true" />
                </div>
                <strong>7.84%</strong>
                <small>+2.1% from last month</small>
              </article>
            </div>

            <div className="preview-bottom-grid">
              <article className="preview-chart-card">
                <div className="preview-card-heading">
                  <div>
                    <span>Performance</span>
                    <strong>Monthly revenue</strong>
                  </div>
                  <span>Last 6 months</span>
                </div>
                <div className="preview-chart">
                  {[42, 58, 48, 72, 64, 88].map((height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </article>

              <article className="preview-activity-card">
                <div className="preview-card-heading">
                  <div>
                    <span>Activity</span>
                    <strong>Recent updates</strong>
                  </div>
                </div>
                <div className="preview-activity-list">
                  <div>
                    <span />
                    <p>
                      <strong>New report created</strong>
                      <small>Marketing performance</small>
                    </p>
                  </div>
                  <div>
                    <span />
                    <p>
                      <strong>Target achieved</strong>
                      <small>Monthly conversions</small>
                    </p>
                  </div>
                  <div>
                    <span />
                    <p>
                      <strong>Customer added</strong>
                      <small>Enterprise account</small>
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default InterfacePreview;
