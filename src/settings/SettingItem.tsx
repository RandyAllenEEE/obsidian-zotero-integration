import { ComponentChild } from 'preact';
import React from 'react';

interface ItemInfo {
  name?: string;
  description?: string | ComponentChild;
  isHeading?: boolean;
  style?: React.CSSProperties;
}

export function SettingItemInfo({ name, description }: ItemInfo) {
  return (
    <div className="setting-item-info">
      <div className="setting-item-name">{name}</div>
      <div className="setting-item-description">{description}</div>
    </div>
  );
}

export function SettingItem({
  name,
  description,
  children,
  isHeading,
  style,
}: React.PropsWithChildren<ItemInfo>) {
  return (
    <div
      className={`zt-setting-item setting-item${
        isHeading ? ' setting-item-heading' : ''
      }`}
      style={style}
    >
      <SettingItemInfo name={name} description={description} />
      <div className="setting-item-control">{children}</div>
    </div>
  );
}
