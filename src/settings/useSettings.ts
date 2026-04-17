import React from 'react';
import { debounce } from 'obsidian';
import { ZoteroConnectorSettings } from '../types';

/**
 * Custom hook for handling toggle settings with unified state management
 * Provides both UI-immediate feedback and debounced persistence
 */
export function useToggleSetting(
  key: keyof ZoteroConnectorSettings,
  updateSetting: (key: keyof ZoteroConnectorSettings, value: any) => void,
  currentValue: boolean
): { isEnabled: boolean; toggle: () => void } {
  const [isEnabled, setIsEnabled] = React.useState(currentValue);

  const toggle = React.useCallback(() => {
    setIsEnabled((prev) => {
      const newValue = !prev;
      updateSetting(key, newValue);
      return newValue;
    });
  }, [key, updateSetting]);

  // Sync local state with global settings when they change externally
  React.useEffect(() => {
    setIsEnabled(currentValue);
  }, [currentValue]);

  return { isEnabled, toggle };
}

/**
 * Custom hook for debounced state updates
 * Provides immediate UI feedback while debouncing the actual save operation
 */
export function useDebouncedState<T>(
  initialValue: T,
  onDebouncedChange: (value: T) => void,
  debounceDelay: number = 300
): {
  value: T;
  setValue: (value: T) => void;
  isDirty: boolean;
} {
  const [value, setValue] = React.useState(initialValue);
  const [isDirty, setIsDirty] = React.useState(false);

  const debouncedUpdate = React.useMemo(
    () =>
      debounce(
        (newValue: T) => {
          onDebouncedChange(newValue);
          setIsDirty(false);
        },
        debounceDelay,
        false
      ),
    [onDebouncedChange, debounceDelay]
  );

  const handleSetValue = React.useCallback(
    (newValue: T) => {
      setValue(newValue);
      setIsDirty(true);
      debouncedUpdate(newValue);
    },
    [debouncedUpdate]
  );

  // Reset to initial value if it changes externally
  React.useEffect(() => {
    setValue(initialValue);
    setIsDirty(false);
  }, [initialValue]);

  return { value, setValue: handleSetValue, isDirty };
}

/**
 * Custom hook for handling debounced array updates (for formats)
 * Provides immediate UI feedback for format list changes
 */
export function useDebouncedArrayState<T>(
  initialValue: T[],
  onDebouncedChange: (index: number, value: T) => void,
  debounceDelay: number = 300
): {
  items: T[];
  updateItem: (index: number, item: T) => void;
  addItem: (item: T) => void;
  removeItem: (index: number) => void;
  isDirty: boolean;
} {
  const [items, setItems] = React.useState(initialValue);
  const [isDirty, setIsDirty] = React.useState(false);

  const debouncedUpdate = React.useMemo(
    () =>
      debounce(
        (index: number, item: T) => {
          onDebouncedChange(index, item);
          setIsDirty(false);
        },
        debounceDelay,
        false
      ),
    [onDebouncedChange, debounceDelay]
  );

  const updateItem = React.useCallback(
    (index: number, item: T) => {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = item;
        return updated;
      });
      setIsDirty(true);
      debouncedUpdate(index, item);
    },
    [debouncedUpdate]
  );

  // Prepend to match plugin.settings.*Formats.unshift() in addCiteFormat / addExportFormat
  const addItem = React.useCallback(
    (item: T) => {
      setItems((prev) => [item, ...prev]);
      setIsDirty(true);
    },
    []
  );

  const removeItem = React.useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  // Reset to initial value if it changes externally
  React.useEffect(() => {
    setItems(initialValue);
    setIsDirty(false);
  }, [initialValue]);

  return { items, updateItem, addItem, removeItem, isDirty };
}

/**
 * Custom hook for debounced input values
 * Provides immediate UI feedback while the actual update is debounced
 */
export function useDebouncedInput(
  initialValue: string,
  onDebouncedChange: (value: string) => void,
  debounceDelay: number = 500
): {
  value: string;
  setValue: (value: string) => void;
  isDirty: boolean;
} {
  const [value, setValue] = React.useState(initialValue);
  const [isDirty, setIsDirty] = React.useState(false);

  const debouncedUpdate = React.useMemo(
    () =>
      debounce(
        (newValue: string) => {
          onDebouncedChange(newValue);
          setIsDirty(false);
        },
        debounceDelay,
        false
      ),
    [onDebouncedChange, debounceDelay]
  );

  const handleSetValue = React.useCallback(
    (newValue: string) => {
      setValue(newValue);
      setIsDirty(true);
      debouncedUpdate(newValue);
    },
    [debouncedUpdate]
  );

  // Reset to initial value if it changes externally
  React.useEffect(() => {
    setValue(initialValue);
    setIsDirty(false);
  }, [initialValue]);

  return { value, setValue: handleSetValue, isDirty };
}
