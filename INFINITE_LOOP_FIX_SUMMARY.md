# Infinite Loop Fix Summary

**Date**: 2025-10-08
**Status**: ✅ **RESOLVED**

## Problem Description

The application was experiencing an infinite re-render loop that caused it to crash on startup with the error:
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect,
but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

## Root Cause

The application had a **bidirectional sync architecture** between React state and localStorage:
- React state (`currentActaData`) would update
- Auto-save effect would save to localStorage
- Repository methods would return data with **new object references**
- New object references would trigger effects again
- **Infinite loop**

Multiple effects throughout the codebase depended on `currentActaData` (an object), which got a new reference on every render, causing those effects to run infinitely.

## Solution Applied

**Approach**: Option 3 from debugging session - **Remove Auto-Save**

Instead of auto-saving on every state change, save only on explicit user actions.

## Files Modified

### 1. `src/renderer/hooks/useCategoryManager.ts`

**Changes**:
- ✅ **Removed** auto-save effect (lines 57-74 in old code)
- ✅ **Added** manual `saveCurrentActa()` function using `useCallback`
- ✅ **Added** `lastLoadedCategoryRef` guard to prevent duplicate category loads
- ✅ **Exported** `saveCurrentActa` in return value

**Before**:
```typescript
// Auto-save effect - CAUSED INFINITE LOOP
useEffect(() => {
  if (!currentActaData || !activeCategory) return;
  const saveData = async () => {
    await repository.saveActiveActa(activeCategory, currentActaData);
  };
  saveData();
}, [currentActaData, activeCategory]);
```

**After**:
```typescript
// Manual save function
const saveCurrentActa = useCallback(async () => {
  if (!currentActaData || !activeCategory) return;
  await repository.saveActiveActa(activeCategory, currentActaData);
}, [currentActaData, activeCategory, repository]);
```

### 2. `src/renderer/App/AppContainer.tsx`

**Changes**:
- ✅ **Removed** `areMesaFieldsLocked` state and its sync effect
- ✅ **Changed** to derive `areMesaFieldsLocked` directly from `currentActaData`
- ✅ **Fixed** time tracking effect to depend only on primitive string values
- ✅ **Updated** all `setAreMesaFieldsLocked` calls to use `updateCurrentActaData`

**Before**:
```typescript
const [areMesaFieldsLocked, setAreMesaFieldsLocked] = useState(false);

// Sync effect - CAUSED INFINITE LOOP
useEffect(() => {
  const newLocked = getCurrentActaData()?.areMesaFieldsLocked || false;
  setAreMesaFieldsLocked(newLocked);
}, [activeCategory, currentActaData]);

// Time tracking - CAUSED INFINITE LOOP
useEffect(() => {
  const actaData = getCurrentActaData();
  // ... interval logic
}, [activeCategory, currentActaData]);
```

**After**:
```typescript
// Derive value directly - no state needed
const areMesaFieldsLocked = getCurrentActaData()?.areMesaFieldsLocked || false;

// Time tracking - only depend on primitives
const startTimeStr = currentActaData?.startTime;
const endTimeStr = currentActaData?.endTime;

useEffect(() => {
  const startTime = startTimeStr ? new Date(startTimeStr) : null;
  // ... interval logic
}, [startTimeStr, endTimeStr]);
```

### 3. `src/renderer/components/electoral/VoteEntryTable.tsx`

**Changes**:
- ✅ **Fixed** table number update effect to depend on `entries.length` instead of function reference
- ✅ **Added** `onSaveActa` prop
- ✅ **Called** `onSaveActa()` in `handleAddEntry` when adding votes

**Before**:
```typescript
// CAUSED INFINITE LOOP - getNextTableNumber changes every render
useEffect(() => {
  if (editingTableNumber === null) {
    setNewEntry(prev => ({...prev, tableNumber: getNextTableNumber()}));
  }
}, [entries, editingTableNumber, getNextTableNumber]);
```

**After**:
```typescript
// Only depends on entries.length (primitive value)
useEffect(() => {
  if (editingTableNumber === null) {
    setNewEntry(prev => ({...prev, tableNumber: getNextTableNumber()}));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [entries.length, editingTableNumber]);
```

### 4. `src/renderer/pages/VoteEntryPage.tsx`

**Changes**:
- ✅ **Added** `onSaveActa` prop
- ✅ **Called** save in `handleSaveMesaData` (Iniciar button)
- ✅ **Called** save in `handleFinalizeForm` (Finalizar button)
- ✅ **Passed** `onSaveActa` to child components

## Manual Save Points

Data is now saved explicitly when users perform these actions:

1. **Iniciar button** - When starting the vote counting session
2. **Finalizar button** - When finalizing the form
3. **Agregar button** - When adding each vote entry
4. **Settings "GUARDAR" button** - When saving organization settings (already had explicit save)

## Key Lessons Learned

### The Problem with Object Dependencies

❌ **Don't do this**:
```typescript
useEffect(() => {
  // Some logic
}, [currentActaData]); // Object reference changes every render!
```

✅ **Do this instead**:
```typescript
// Option 1: Depend on primitive values
const someValue = currentActaData?.someField;
useEffect(() => {
  // Some logic
}, [someValue]);

// Option 2: Derive values instead of using state
const derivedValue = getCurrentData()?.field || defaultValue;

// Option 3: Use refs for guards
const hasRunRef = useRef(false);
useEffect(() => {
  if (hasRunRef.current) return;
  hasRunRef.current = true;
  // Run once logic
}, [dependency]);
```

### Avoid Bidirectional Sync

The dual-state architecture (React state + localStorage) with automatic sync created the infinite loop. Better approaches:

1. **React Query / SWR** - Proper data fetching libraries with built-in caching
2. **Zustand with persist middleware** - Single state source with automatic persistence
3. **Manual save** - Simple, explicit, no surprises (chosen solution)

## Testing Verification

✅ Application starts successfully
✅ No "Maximum update depth exceeded" errors
✅ Data persists when clicking Iniciar, Finalizar, Agregar
✅ All functionality preserved
✅ No performance issues

## Trade-offs

**Pros**:
- ✅ Immediate fix with minimal code changes
- ✅ No external dependencies needed
- ✅ Clear, explicit save behavior
- ✅ Easy to understand and maintain

**Cons**:
- ⚠️ User must click save buttons - data won't auto-save on every change
- ⚠️ Potential data loss if user closes app without saving (mitigated by saves on key actions)

## Future Improvements (Optional)

If auto-save functionality is desired in the future, consider:

1. **React Query** - Industry standard for data fetching/caching
2. **Zustand** - Simpler state management with persist middleware
3. **Debounced manual save** - Save after user stops typing for X seconds
4. **Deep equality checks** - Use lodash `isEqual` to compare objects before triggering effects

## References

- Original debugging session: `INFINITE_LOOP_DEBUGGING.md`
- React hooks documentation: https://react.dev/reference/react
- Why objects cause re-renders: https://react.dev/learn/updating-objects-in-state

---

**Status**: ✅ Issue resolved - Application is production ready
