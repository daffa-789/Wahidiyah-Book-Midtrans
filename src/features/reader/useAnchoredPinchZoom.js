import { useLayoutEffect, useRef } from 'react';

const MIN_ZOOM = 40;
const MAX_ZOOM = 300;
const MIN_GESTURE_FACTOR = 0.8;
const MAX_GESTURE_FACTOR = 1.25;
const PINCH_SENSITIVITY = 0.45;

const getTouchDistance = (touches) =>
  Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  );

const getTextPositionAtPoint = (x, y) => {
  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    if (position?.offsetNode?.nodeType === Node.TEXT_NODE) {
      return { node: position.offsetNode, offset: position.offset };
    }
  }

  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (range?.startContainer?.nodeType === Node.TEXT_NODE) {
      return { node: range.startContainer, offset: range.startOffset };
    }
  }

  return null;
};

/** Keeps the text beneath a mobile pinch point in place as the document reflows. */
export const useAnchoredPinchZoom = ({ containerRef, zoom, setZoom }) => {
  const startDistanceRef = useRef(0);
  const startZoomRef = useRef(zoom);
  const isPinchingRef = useRef(false);
  const pinchRafRef = useRef(null);
  const pendingAnchorRef = useRef(null);
  const previousZoomRef = useRef(zoom);

  const handleTouchStart = (event) => {
    if (event.touches.length !== 2) return;

    startDistanceRef.current = getTouchDistance(event.touches);
    startZoomRef.current = zoom;
    isPinchingRef.current = true;
  };

  const handleTouchMove = (event) => {
    if (!isPinchingRef.current || event.touches.length !== 2) return;
    if (event.cancelable) event.preventDefault();

    const currentDistance = getTouchDistance(event.touches);
    if (startDistanceRef.current <= 10) return;

    const midpointX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
    const midpointY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      pendingAnchorRef.current = {
        container,
        position: getTextPositionAtPoint(midpointX, midpointY),
        focalX: midpointX - rect.left,
        focalY: midpointY - rect.top,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
        scrollWidth: container.scrollWidth,
        scrollHeight: container.scrollHeight
      };
    }

    if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
    pinchRafRef.current = requestAnimationFrame(() => {
      const rawFactor = currentDistance / startDistanceRef.current;
      const easedFactor = 1 + (rawFactor - 1) * PINCH_SENSITIVITY;
      const gestureFactor = Math.min(
        MAX_GESTURE_FACTOR,
        Math.max(MIN_GESTURE_FACTOR, easedFactor)
      );
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Math.round(startZoomRef.current * gestureFactor))
      );
      setZoom(nextZoom);
    });
  };

  const handleTouchEnd = (event) => {
    if (isPinchingRef.current && event.touches.length < 2) {
      isPinchingRef.current = false;
      startDistanceRef.current = 0;
    }
  };

  useLayoutEffect(() => {
    if (previousZoomRef.current === zoom) return;
    previousZoomRef.current = zoom;

    const anchor = pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    const container = containerRef.current;
    if (!anchor || anchor.container !== container || !container?.isConnected) return;

    const { position } = anchor;
    if (position?.node?.isConnected && container.contains(position.node)) {
      const range = document.createRange();
      const maxOffset = position.node.textContent?.length || 0;
      range.setStart(position.node, Math.min(position.offset, maxOffset));
      range.collapse(true);

      const caretRect = range.getBoundingClientRect();
      if (caretRect.height > 0) {
        const containerRect = container.getBoundingClientRect();
        container.scrollTop += caretRect.top - (containerRect.top + anchor.focalY);
        container.scrollLeft += caretRect.left - (containerRect.left + anchor.focalX);
        return;
      }
    }

    const verticalRange = Math.max(1, anchor.scrollHeight - container.clientHeight);
    const horizontalRange = Math.max(1, anchor.scrollWidth - container.clientWidth);
    const verticalRatio = anchor.scrollTop / verticalRange;
    const horizontalRatio = anchor.scrollLeft / horizontalRange;
    container.scrollTop = verticalRatio * Math.max(0, container.scrollHeight - container.clientHeight);
    container.scrollLeft = horizontalRatio * Math.max(0, container.scrollWidth - container.clientWidth);
  }, [containerRef, zoom]);

  useLayoutEffect(() => () => {
    if (pinchRafRef.current) cancelAnimationFrame(pinchRafRef.current);
  }, []);

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
};
