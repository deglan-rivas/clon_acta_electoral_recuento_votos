/*import { useRef, useCallback } from 'react';

interface UseActaNumberInputProps {
  localActaNumber: string;
  setLocalActaNumber: (value: string) => void;
  setLocalMesaNumber: (value: string) => void;
}

export function useActaNumberInput({
  localActaNumber,
  setLocalActaNumber,
  setLocalMesaNumber
}: UseActaNumberInputProps) {
  const cursorPositionRef = useRef<number | null>(null);
  const shouldPreserveCursorRef = useRef<boolean>(false);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const input = e.target as HTMLInputElement;
      const cursorPosition = input.selectionStart || 0;
      const currentValue = input.value;

      // If cursor is right after a dash and there's no selection
      if (cursorPosition > 0 && currentValue[cursorPosition - 1] === '-' && input.selectionStart === input.selectionEnd) {
        e.preventDefault();
        // Remove the dash and the character before it
        const newValue = currentValue.slice(0, cursorPosition - 2) + currentValue.slice(cursorPosition);
        setLocalActaNumber(newValue);

        // Update Mesa field if we're editing the first 6 digits
        const parts = newValue.split('-');
        if (parts[0] && parts[0].length <= 6) {
          setLocalMesaNumber(parts[0]);
        }

        // Set cursor position after the deletion
        setTimeout(() => {
          input.setSelectionRange(cursorPosition - 2, cursorPosition - 2);
        }, 0);
      }
    }
  }, [setLocalActaNumber, setLocalMesaNumber]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const newValue = e.target.value.toUpperCase();
    const oldValue = localActaNumber;
    const cursorPosition = input.selectionStart || 0;

    // Allow direct editing while maintaining format
    let formattedValue = newValue;

    // Remove invalid characters but preserve structure
    formattedValue = formattedValue.replace(/[^0-9A-Z\-]/g, '');

    // Detect if this is normal editing (backspace/delete/typing within first 6 digits)
    const isNormalEditing = Math.abs(newValue.length - oldValue.length) === 1 && cursorPosition <= 6;

    // Validate the format structure
    const parts = formattedValue.split('-');

    if (parts.length === 1) {
      // Only first part (up to 6 digits)
      const digits = parts[0].replace(/[^0-9]/g, '');

      if (digits.length <= 6) {
        formattedValue = digits;
        cursorPositionRef.current = cursorPosition;
        shouldPreserveCursorRef.current = true;

        // Auto-add first dash when reaching 6 digits
        if (digits.length === 6 && !newValue.includes('-')) {
          formattedValue = digits + '-';
          cursorPositionRef.current = digits.length + 1;
          shouldPreserveCursorRef.current = true;
        }
      } else {
        return; // Don't update if too many digits
      }
    } else if (parts.length === 2) {
      // First part + second part
      const firstPart = parts[0].replace(/[^0-9]/g, '').slice(0, 6);
      const secondPart = parts[1].replace(/[^0-9]/g, '').slice(0, 2);

      if (firstPart.length >= 1 && firstPart.length <= 6) {
        formattedValue = firstPart + '-' + secondPart;
        // Sync with Mesa field
        setLocalMesaNumber(firstPart);

        // Preserve cursor position for editing within first part
        if (isNormalEditing && cursorPosition <= 6) {
          cursorPositionRef.current = cursorPosition;
          shouldPreserveCursorRef.current = true;
        }

        // Auto-add second dash when reaching 2 digits in second part
        if (secondPart.length === 2 && !newValue.endsWith('-') && newValue.split('-').length === 2) {
          formattedValue = firstPart + '-' + secondPart + '-';
          cursorPositionRef.current = formattedValue.length;
          shouldPreserveCursorRef.current = true;
        }
      } else {
        return; // Don't update if first part incomplete
      }
    } else if (parts.length === 3) {
      // Full format: NNNNNN-NN-L (6 digits - 2 digits - 1 letter)
      const firstPart = parts[0].replace(/[^0-9]/g, '').slice(0, 6);
      const secondPart = parts[1].replace(/[^0-9]/g, '').slice(0, 2);
      const thirdPart = parts[2].replace(/[^A-Z]/g, '').slice(0, 1);

      if (firstPart.length >= 1 && firstPart.length <= 6 && secondPart.length <= 2) {
        formattedValue = firstPart + '-' + secondPart + '-' + thirdPart;
        // Sync with Mesa field
        setLocalMesaNumber(firstPart);

        // Preserve cursor position for editing within first part
        if (isNormalEditing && cursorPosition <= 6) {
          cursorPositionRef.current = cursorPosition;
          shouldPreserveCursorRef.current = true;
        }
      } else {
        return; // Don't update if format invalid
      }
    } else {
      return; // Too many parts, don't update
    }

    // Only update if within expected length (max 11: 6+1+2+1+1)
    if (formattedValue.length <= 11) {
      setLocalActaNumber(formattedValue);

      // Restore cursor position if needed
      if (shouldPreserveCursorRef.current && cursorPositionRef.current !== null) {
        setTimeout(() => {
          input.setSelectionRange(cursorPositionRef.current!, cursorPositionRef.current!);
          shouldPreserveCursorRef.current = false;
          cursorPositionRef.current = null;
        }, 0);
      }
    }
  }, [localActaNumber, setLocalActaNumber, setLocalMesaNumber]);

  return {
    handleKeyDown,
    handleChange
  };
}
*/