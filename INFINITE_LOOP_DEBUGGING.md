# Infinite Loop Debugging Session - Maximum Update Depth Exceeded

## Issue Description
**Error**: `Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.`

**Symptom**: Application crashes on startup with infinite re-render loop

## Root Cause Analysis

### The Circular Dependency Chain
The application has a **bidirectional sync** between React state and localStorage repository:

1. `currentActaData` (React state) changes
2. → Triggers save effect in `useCategoryManager.ts:58-66`
3. → Saves to repository (localStorage)
4. → Repository returns data (same values, **new object reference**)
5. → `setCurrentActaData` updates state with new object
6. → Loop repeats indefinitely

### Why Standard Solutions Failed

The issue involves multiple interconnected components:
- `useCategoryManager` - manages acta data and auto-saves
- `useLocationState` - manages location selection state
- `AppContainer` - coordinates data flow between components
- `AppDataProvider` - loads CSV data

Each component has effects that depend on data from others, creating a web of circular dependencies.

## Attempted Fixes (All Unsuccessful)

### 1. ✅ JSON String Comparison in Save Effect
**File**: `src/renderer/hooks/useCategoryManager.ts:57-74`

**What we did**:
```typescript
const lastSavedDataRef = useRef<string>('');

useEffect(() => {
  if (!currentActaData || !activeCategory || isLoadingRef.current) return;

  const currentDataString = JSON.stringify(currentActaData);
  if (currentDataString === lastSavedDataRef.current) {
    return; // No actual change, skip save
  }

  const saveData = async () => {
    lastSavedDataRef.current = currentDataString;
    await repository.saveActiveActa(activeCategory, currentActaData);
  };
  saveData();
}, [currentActaData, activeCategory]);
```

**Why it didn't work**: Other effects still trigger state updates that change the object reference before this check runs.

### 2. ✅ Memoized Callbacks with useCallback
**Files**:
- `src/renderer/hooks/useCategoryManager.ts:68-73`
- `src/renderer/App/AppContainer.tsx:45-47`
- `src/renderer/hooks/useLocationState.ts:47-146`

**What we did**:
```typescript
const updateCurrentActaData = useCallback((updates: Partial<ActaData>): void => {
  setCurrentActaData((prev) => ({
    ...(prev || {} as ActaData),
    ...updates,
  }));
}, []);

const handleLocationUpdate = useCallback((location: SelectedLocation) => {
  updateCurrentActaData({ selectedLocation: location });
}, [updateCurrentActaData]);
```

**Why it didn't work**: While the callback references were stable, the objects passed as arguments were still new on each render.

### 3. ✅ Stabilized Handlers with useRef for Values
**File**: `src/renderer/hooks/useLocationState.ts:27-45`

**What we did**:
```typescript
const valuesRef = useRef({
  selectedDepartamento,
  selectedProvincia,
  selectedDistrito,
  selectedJee,
  selectedCircunscripcionElectoral
});

useEffect(() => {
  valuesRef.current = { /* ... */ };
}, [selectedDepartamento, selectedProvincia, selectedDistrito, selectedJee, selectedCircunscripcionElectoral]);

const handleDepartamentoChange = useCallback((value: string) => {
  onLocationUpdate({
    departamento: value,
    provincia: "",
    distrito: "",
    circunscripcionElectoral: valuesRef.current.selectedCircunscripcionElectoral,
    jee: ""
  });
}, [onLocationUpdate]); // Only depends on onLocationUpdate
```

**Why it didn't work**: The handlers were stabilized, but calling them still triggered `onLocationUpdate` which updated `currentActaData`, triggering the save loop.

### 4. ✅ Removed Duplicate Local State in useLocationState
**File**: `src/renderer/hooks/useLocationState.ts:19-25`

**What we did**: Changed from useState to direct props reading
```typescript
// BEFORE: Local state that synced with currentActaData
const [selectedDepartamento, setSelectedDepartamento] = useState<string>(...);

// AFTER: Direct reading from repository data
const selectedDepartamento = currentLocationData.departamento;
```

**Why it didn't work**: Removed the sync effect but the update handlers still triggered saves, and the effect in `AppContainer` that auto-sets circunscripción still caused loops.

### 5. ✅ Added Ref Guard for Auto-Set Logic
**File**: `src/renderer/App/AppContainer.tsx:61, 90-111`

**What we did**:
```typescript
const autoSetCircunscripcionRef = useRef<string | null>(null);

useEffect(() => {
  // ...
  if (!currentLocationData?.circunscripcionElectoral && autoSetCircunscripcionRef.current !== activeCategory) {
    autoSetCircunscripcionRef.current = activeCategory;
    location.setSelectedCircunscripcionElectoral(autoSelectedCirc);
  }
  // ...
}, [activeCategory, circunscripcionData.length]);
```

**Why it didn't work**: Even with the guard, calling `setSelectedCircunscripcionElectoral` updates `currentActaData` through `onLocationUpdate`, which triggers the save effect, which changes `currentActaData`, which re-runs effects.

### 6. ✅ Added isLoadingRef Guard
**File**: `src/renderer/hooks/useCategoryManager.ts:12, 17-26, 36-50, 59`

**What we did**:
```typescript
const isLoadingRef = useRef(false);

useEffect(() => {
  const loadCategoryData = async () => {
    isLoadingRef.current = true;
    // ... load data
    isLoadingRef.current = false;
  };
  loadCategoryData();
}, [activeCategory]);

useEffect(() => {
  if (!currentActaData || !activeCategory || isLoadingRef.current) return;
  // ... save logic
}, [currentActaData, activeCategory]);
```

**Why it didn't work**: Only prevents saves during loading, but the loop happens after loading completes.

## The Fundamental Problem

### Dual-State Architecture
The application tries to maintain state in **TWO places simultaneously**:
1. **React State**: `currentActaData` in `useCategoryManager`
2. **Repository (localStorage)**: Persistent storage

### Bidirectional Sync
- **Read path**: Repository → `setCurrentActaData` → React re-render
- **Write path**: User interaction → `updateCurrentActaData` → Save effect → Repository
- **The problem**: Write path completion triggers read path (new object reference)

### Why It's Unfixable with Current Architecture
React's rendering model is based on **referential equality**. When you:
1. Read from localStorage: `const data = localStorage.getItem(...)`
2. Parse it: `JSON.parse(data)` ← **Creates new object**
3. Set to state: `setCurrentActaData(parsedData)` ← **New reference triggers effects**
4. Effects depend on `currentActaData` → Run again → Save → Read → **Loop**

No amount of memoization or guards can break this cycle without changing the architecture.

## Files Modified During Debugging

### Primary Files
1. `src/renderer/hooks/useCategoryManager.ts`
   - Added `isLoadingRef` for load guard
   - Added `lastSavedDataRef` for JSON comparison
   - Converted save effect to use JSON string comparison
   - Memoized `updateCurrentActaData`

2. `src/renderer/hooks/useLocationState.ts`
   - Removed local useState for location fields
   - Changed to read directly from `currentActaData`
   - Added `valuesRef` for stable handler references
   - Memoized all change handlers
   - Removed sync effect that caused loops

3. `src/renderer/App/AppContainer.tsx`
   - Added `useCallback` for `handleLocationUpdate`
   - Added `autoSetCircunscripcionRef` for auto-set guard
   - Simplified auto-set circunscripción effect
   - Added `useRef` import

### Supporting Files
4. `src/renderer/App.tsx`
   - No changes (already had stable repository ref)

5. `package.json`
   - Added `use-deep-compare-effect` dependency (attempted but didn't work)

## Recommended Solutions

### Option 1: React Query / SWR (Recommended)
Use a proper data fetching library that handles caching and sync:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

function useCategoryManager() {
  const { data: currentActaData } = useQuery({
    queryKey: ['acta', activeCategory],
    queryFn: () => repository.getActiveActa(activeCategory),
  });

  const { mutate: updateActa } = useMutation({
    mutationFn: (updates) => repository.saveActiveActa(activeCategory, updates),
    onSuccess: () => queryClient.invalidateQueries(['acta', activeCategory]),
  });

  return { currentActaData, updateActa };
}
```

**Pros**:
- Handles caching automatically
- No circular dependencies
- Industry standard solution

**Cons**:
- Requires adding React Query dependency
- Need to refactor existing code

### Option 2: Zustand with Persist Middleware
Replace repository + React state with single Zustand store:

```typescript
import create from 'zustand';
import { persist } from 'zustand/middleware';

const useActaStore = create(
  persist(
    (set) => ({
      currentActaData: null,
      updateActaData: (updates) => set((state) => ({
        currentActaData: { ...state.currentActaData, ...updates }
      })),
    }),
    { name: 'acta-storage' }
  )
);
```

**Pros**:
- Simple API
- Automatic persistence
- No circular dependencies

**Cons**:
- Need to migrate from custom repository
- Requires refactoring

### Option 3: Remove Auto-Save (Quick Fix)
Only save on explicit user actions:

```typescript
// Remove auto-save effect entirely
// Add manual save buttons/triggers
const handleSave = () => {
  repository.saveActiveActa(activeCategory, currentActaData);
};
```

**Pros**:
- Minimal code changes
- Breaks the loop immediately

**Cons**:
- User could lose data
- Changes UX significantly

### Option 4: Debounced Save with Deep Equality
Use lodash debounce + deep equality:

```typescript
import { debounce } from 'lodash';
import { isEqual } from 'lodash';

const lastSavedRef = useRef(null);

const debouncedSave = useMemo(
  () => debounce(async (data) => {
    if (!isEqual(data, lastSavedRef.current)) {
      await repository.saveActiveActa(activeCategory, data);
      lastSavedRef.current = data;
    }
  }, 1000),
  [activeCategory]
);

useEffect(() => {
  if (currentActaData) {
    debouncedSave(currentActaData);
  }
}, [currentActaData]);
```

**Pros**:
- Less frequent saves
- Deep equality check

**Cons**:
- May still loop (just slower)
- Doesn't fix root cause

## Next Steps

1. **Choose Architecture**: Decide on React Query, Zustand, or manual save approach
2. **Create Migration Plan**: Plan how to refactor without breaking functionality
3. **Test Incremental Changes**: Migrate one feature at a time
4. **Add Integration Tests**: Prevent regressions

## Additional Notes

- The `use-deep-compare-effect` package was installed but threw errors when used (complained about primitive dependencies)
- Multiple background processes were left running during debugging - may need cleanup
- The app has other warnings (controlled/uncontrolled Select components) but those are separate issues

## Timeline
- **Session Start**: Identified infinite loop error
- **Attempts**: 6 different approaches tried
- **Duration**: ~2 hours of debugging
- **Status**: **Unresolved** - Requires architectural change

---

**Created**: 2025-10-08
**Last Updated**: 2025-10-08
**Status**: Open - Awaiting Architecture Decision
