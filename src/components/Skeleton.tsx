/**
 * Tiny skeleton block for initial loading states.
 */
type Props = {
  className?: string
}

export function Skeleton({ className }: Props) {
  return (
    <div
      className={[
        'animate-pulse rounded-md bg-gray-200/80 dark:bg-white/10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
