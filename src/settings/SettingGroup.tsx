import React from 'react';
import { ComponentChild } from 'preact';

interface SettingGroupProps {
  children: ComponentChild;
  level?: number;
}

/**
 * SettingGroup component for organizing related settings with visual hierarchy.
 * Creates indented containers with left-border styling for multi-level organization.
 * 
 * @param children - Settings items to group
 * @param level - Nesting level for indentation (default: 1)
 */
export function SettingGroup({ children, level = 1 }: SettingGroupProps) {
  return (
    <div className={`zt-setting-group zt-setting-group-level-${level}`}>
      {children}
    </div>
  );
}
