import { useEffect } from 'react'

type UseInfiniteScrollConfig = {
  containerRef: React.RefObject<HTMLDivElement>
  hasMore: boolean
  onFetchMore: () => void
}

export const useInfiniteScroll = ({ containerRef, hasMore, onFetchMore }: UseInfiniteScrollConfig) => {
  useEffect(() => {
    if (!hasMore) return

    const handleScroll = () => {
      const element = containerRef.current
      if (element) {
        const isBottom = element.scrollHeight - element.scrollTop === element.clientHeight
        if (isBottom) {
          onFetchMore()
        }
      }
    }

    const element = containerRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
    }
    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll)
      }
    }
  }, [containerRef, hasMore, onFetchMore])
}
