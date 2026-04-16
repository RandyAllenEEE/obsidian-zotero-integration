/**
 * UI State Feedback & State Management Improvements
 * 
 * This file demonstrates how to solve the UI feedback delay and state management issues
 */

// ============================================================================
// PROBLEM 1: Debounce Delay on Format Updates
// ============================================================================

// ❌ CURRENT IMPLEMENTATION (settings.tsx lines 73-80)
// Problem: UI updates are delayed by 200ms
const updateCite_OLD = React.useCallback(
  debounce(
    (index: number, format: CitationFormat) => {
      setCiteFormatState(updateCiteFormat(index, format));
    },
    200,
    true
  ),
  [updateCiteFormat]
);

// ✅ IMPROVED IMPLEMENTATION 1: Immediate UI Update + Debounced Persistence
// Solution: Update UI immediately, but debounce the actual save
interface CiteFormatState {
  formats: CitationFormat[];
  isDirty: boolean;
}

const [citeFormatState, setCiteFormatState] = React.useState<CiteFormatState>({
  formats: settings.citeFormats,
  isDirty: false,
});

const debouncedSaveCiteFormat = React.useMemo(
  () =>
    debounce(
      (index: number, format: CitationFormat) => {
        // Only save when user stops editing
        updateCiteFormat(index, format);
        setCiteFormatState((prev) => ({
          ...prev,
          isDirty: false,
        }));
      },
      500, // Wait 500ms after last change before saving
      false
    ),
  [updateCiteFormat]
);

const handleCiteFormatChange = React.useCallback(
  (index: number, format: CitationFormat) => {
    // Update UI immediately
    setCiteFormatState((prev) => ({
      formats: prev.formats.map((f, i) => (i === index ? format : f)),
      isDirty: true,
    }));

    // Debounce the actual persistence
    debouncedSaveCiteFormat(index, format);
  },
  [debouncedSaveCiteFormat]
);

// ============================================================================
// PROBLEM 2: Inconsistent State Management for Toggles
// ============================================================================

// ❌ CURRENT IMPLEMENTATION (Mixed local + global state)
// settings.tsx lines 49-50, 61-62, 320
const [openNoteAfterImportState, setOpenNoteAfterImport] = React.useState(
  !!settings.openNoteAfterImport
);
const [ocrState, setOCRState] = React.useState(settings.pdfExportImageOCR);

// But this one uses global state directly:
<div
  onClick={() => updateSetting('autoSummarize', !settings.autoSummarize)}
  className={`checkbox-container${settings.autoSummarize ? ' is-enabled' : ''}`}
/>

// ✅ IMPROVED IMPLEMENTATION 2: Unified Toggle State Handler

// Create a custom hook for toggle handling
function useToggleSetting(
  key: keyof ZoteroConnectorSettings,
  initialValue: boolean
) {
  const [localState, setLocalState] = React.useState(initialValue);

  const handleToggle = React.useCallback(() => {
    const newValue = !localState;
    setLocalState(newValue);
    updateSetting(key, newValue);
  }, [localState, key]);

  // Sync local state with global settings
  React.useEffect(() => {
    setLocalState(!!settings[key]);
  }, [settings[key]]);

  return { isEnabled: localState, toggle: handleToggle };
}

// Usage in component:
const openNoteAfterImport = useToggleSetting('openNoteAfterImport', settings.openNoteAfterImport);
const pdfExportImageOCR = useToggleSetting('pdfExportImageOCR', settings.pdfExportImageOCR);
const shouldConcat = useToggleSetting('shouldConcat', settings.shouldConcat);
const autoSummarize = useToggleSetting('autoSummarize', settings.autoSummarize);

// Now all toggles use the same pattern:
<div
  onClick={openNoteAfterImport.toggle}
  className={`checkbox-container${openNoteAfterImport.isEnabled ? ' is-enabled' : ''}`}
/>

<div
  onClick={pdfExportImageOCR.toggle}
  className={`checkbox-container${pdfExportImageOCR.isEnabled ? ' is-enabled' : ''}`}
/>

<div
  onClick={shouldConcat.toggle}
  className={`checkbox-container${shouldConcat.isEnabled ? ' is-enabled' : ''}`}
/>

// ============================================================================
// PROBLEM 3: Path Input Debounce Delay
// ============================================================================

// ❌ CURRENT IMPLEMENTATION (AssetDownloader.tsx lines 96-107)
// Problem: 150ms delay on path changes
const setOverride_OLD = React.useMemo(
  () =>
    debounce(
      (path: string) => {
        setOverridePath(path);
        props.updateSetting('exeOverridePath', path);
      },
      150,
      true
    ),
  []
);

// ✅ IMPROVED IMPLEMENTATION 3: Separate UI State and Persistence
const [overridePath, setOverridePath] = React.useState(
  props.settings.exeOverridePath || ''
);

const debouncedUpdatePath = React.useMemo(
  () =>
    debounce(
      (path: string) => {
        props.updateSetting('exeOverridePath', path);
      },
      500,
      false
    ),
  [props]
);

const handlePathChange = React.useCallback(
  (newPath: string) => {
    // Immediate UI update
    setOverridePath(newPath);
    
    // Debounced save (only after user stops typing)
    debouncedUpdatePath(newPath);
  },
  [debouncedUpdatePath]
);

// ============================================================================
// COMPLETE REFACTORED SETTINGS COMPONENT
// ============================================================================

// File: src/settings/settings.tsx (improved version)

interface ToggleSetting {
  isEnabled: boolean;
  toggle: () => void;
}

function useToggleSetting(
  key: keyof ZoteroConnectorSettings,
  updateSetting: (key: keyof ZoteroConnectorSettings, value: any) => void,
  currentValue: boolean
): ToggleSetting {
  const [isEnabled, setIsEnabled] = React.useState(currentValue);

  const toggle = React.useCallback(() => {
    setIsEnabled((prev) => {
      const newValue = !prev;
      updateSetting(key, newValue);
      return newValue;
    });
  }, [key, updateSetting]);

  React.useEffect(() => {
    setIsEnabled(currentValue);
  }, [currentValue]);

  return { isEnabled, toggle };
}

function SettingsComponent({
  app,
  settings,
  addCiteFormat,
  updateCiteFormat,
  removeCiteFormat,
  addExportFormat,
  updateExportFormat,
  removeExportFormat,
  updateSetting,
}: SettingsComponentProps) {
  // Format state management - with improved debouncing
  const [citeFormatState, setCiteFormatState] = React.useState(
    settings.citeFormats
  );
  const [exportFormatState, setExportFormatState] = React.useState(
    settings.exportFormats
  );

  // Debounced update functions (for persistence, not UI)
  const debouncedUpdateCiteFormat = React.useMemo(
    () =>
      debounce(
        (index: number, format: CitationFormat) => {
          updateCiteFormat(index, format);
        },
        300,
        false
      ),
    [updateCiteFormat]
  );

  const debouncedUpdateExportFormat = React.useMemo(
    () =>
      debounce(
        (index: number, format: ExportFormat) => {
          updateExportFormat(index, format);
        },
        300,
        false
      ),
    [updateExportFormat]
  );

  // Unified toggle handling
  const openNoteAfterImport = useToggleSetting(
    'openNoteAfterImport',
    updateSetting,
    !!settings.openNoteAfterImport
  );

  const pdfExportImageOCR = useToggleSetting(
    'pdfExportImageOCR',
    updateSetting,
    !!settings.pdfExportImageOCR
  );

  const shouldConcat = useToggleSetting(
    'shouldConcat',
    updateSetting,
    !!settings.shouldConcat
  );

  const autoSummarize = useToggleSetting(
    'autoSummarize',
    updateSetting,
    settings.autoSummarize
  );

  const sanitizeTitles = useToggleSetting(
    'sanitizeTitles',
    updateSetting,
    !!settings.sanitizeTitles
  );

  // Handlers for format changes - immediate UI update
  const handleCiteFormatChange = React.useCallback(
    (index: number, format: CitationFormat) => {
      // Update UI immediately
      setCiteFormatState((prev) =>
        prev.map((f, i) => (i === index ? format : f))
      );
      // Save to disk on delay
      debouncedUpdateCiteFormat(index, format);
    },
    [debouncedUpdateCiteFormat]
  );

  const handleExportFormatChange = React.useCallback(
    (index: number, format: ExportFormat) => {
      // Update UI immediately
      setExportFormatState((prev) =>
        prev.map((f, i) => (i === index ? format : f))
      );
      // Save to disk on delay
      debouncedUpdateExportFormat(index, format);
    },
    [debouncedUpdateExportFormat]
  );

  // JSX Example showing unified patterns:
  return (
    <div>
      {/* Regular toggle - unified pattern */}
      <SettingItem name="Enable Annotation Concatenation">
        <div
          onClick={shouldConcat.toggle}
          className={`checkbox-container${shouldConcat.isEnabled ? ' is-enabled' : ''}`}
        />
      </SettingItem>

      {/* Another toggle - same pattern */}
      <SettingItem name="Open notes after import">
        <div
          onClick={openNoteAfterImport.toggle}
          className={`checkbox-container${openNoteAfterImport.isEnabled ? ' is-enabled' : ''}`}
        />
      </SettingItem>

      {/* Conditional toggle */}
      <SettingItem name="Image OCR">
        <div
          onClick={pdfExportImageOCR.toggle}
          className={`checkbox-container${pdfExportImageOCR.isEnabled ? ' is-enabled' : ''}`}
        />
      </SettingItem>

      {/* AI toggle */}
      <SettingItem name="Auto-trigger AI Summary">
        <div
          onClick={autoSummarize.toggle}
          className={`checkbox-container${autoSummarize.isEnabled ? ' is-enabled' : ''}`}
        />
      </SettingItem>
    </div>
  );
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/*
BEFORE (Current Implementation):
- User types in format name: 200ms delay before UI update
- User changes export format: 200ms delay before UI update
- User enters PDF path: 150ms delay before input feedback
- Overall experience: Sluggish, not responsive

AFTER (Improved Implementation):
- User types in format name: <16ms UI update, 300ms save (invisible to user)
- User changes export format: <16ms UI update, 300ms save (invisible to user)
- User enters PDF path: <16ms UI feedback, 500ms save (invisible to user)
- Overall experience: Snappy, responsive, feels native

Benefit: Saves are debounced for performance, but UI feels instant
*/

// ============================================================================
// TESTING RECOMMENDATIONS
// ============================================================================

/*
1. Test Toggle Responsiveness
   - Click toggles rapidly -> should respond immediately with no lag
   - Change toggles while settings reload -> should stay in sync

2. Test Format Updates
   - Edit format name quickly -> should see changes in real-time
   - Close settings panel during edit -> changes should save

3. Test Path Inputs
   - Type path quickly -> input should respond immediately
   - Clear and re-enter path -> should update properly

4. Test Batch Changes
   - Make multiple changes rapidly -> should debounce saves efficiently
   - Monitor disk I/O -> should not create excessive writes

5. Sync Tests
   - Change setting externally -> settings panel should reflect change
   - Refresh settings -> all toggles should be in correct state
*/
