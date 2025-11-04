// ActaTimerDisplay - Displays start time, end time, and elapsed duration
// Shows colored badges for different timer states

interface ActaTimerDisplayProps {
  startTime: Date | null;
  endTime: Date | null;
  currentTime: Date;
  isPaused?: boolean;
  pausedDuration?: number; // Cumulative paused time in milliseconds
}

// Format time as HH:MM:SS
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// Format elapsed time as HH:MM:SS, subtracting paused duration
const formatElapsedTime = (start: Date, end: Date, pausedDurationMs: number = 0): string => {
  const elapsedMs = end.getTime() - start.getTime() - pausedDurationMs;
  // Ensure elapsed time is never negative (can happen briefly after resume before currentTime updates)
  const safeElapsedMs = Math.max(0, elapsedMs);
  const elapsed = Math.floor(safeElapsedMs / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function ActaTimerDisplay({
  startTime,
  endTime,
  currentTime,
  isPaused = false,
  pausedDuration = 0,
}: ActaTimerDisplayProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Start Time */}
      {startTime && (
        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg font-medium text-sm text-center">
          <div className="font-semibold">Hora Inicio</div>
          <div className="font-semibold">{formatTime(startTime)}</div>
        </div>
      )}

      {/* End Time */}
      {endTime && (
        <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg font-medium text-sm text-center">
          <div className="font-semibold">Hora Fin</div>
          <div className="font-semibold">{formatTime(endTime)}</div>
        </div>
      )}

      {/* Elapsed Time (in progress or paused) */}
      {startTime && !endTime && (
        <div
          className="px-3 py-2 rounded-lg font-medium text-sm text-center"
          style={{
            backgroundColor: isPaused ? '#fef3c7' : '#fefce8',
            color: isPaused ? '#92400e' : '#a16207'
          }}
        >
          <div className="font-semibold">{isPaused ? 'Pausado' : 'En Progreso'}</div>
          <div className="font-semibold">
            {formatElapsedTime(startTime, currentTime, pausedDuration)}
          </div>
        </div>
      )}

      {/* Total Time (when finished) */}
      {startTime && endTime && (
        <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium text-sm text-center">
          <div className="font-semibold">Tiempo Total</div>
          <div className="font-semibold">
            {formatElapsedTime(startTime, endTime, pausedDuration)}
          </div>
        </div>
      )}
    </div>
  );
}
