/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useRef } from 'react';
import {
  IPointData,
  IUI,
  MoveEvent,
  PointerEvent,
  UI,
  ZoomEvent,
} from 'leafer-ui';
import { useShallow } from 'zustand/react/shallow';
import useModelStore, { debounceUpdateCmpsWithMerge } from '~/store/model';
import useToolbarStore, { ToolBarState } from '~/store/toolbar';
import { Cmp, CmpType } from '~/interface/cmp';
import { generateCmp } from './generator';
import {
  EditorEvent,
  EditorMoveEvent,
  EditorRotateEvent,
  EditorScaleEvent,
} from 'leafer-react';
import useCanvasStore from '~/store/canvas';
import debounce from 'lodash-es/debounce';

export default function useEventHandler() {
  const pointDownRef = useRef<IPointData>(null);
  const { app, setGenCmp, setShowSetting } = useCanvasStore(
    useShallow((state) => ({
      app: state.app,
      setGenCmp: state.setGenCmp,
      setShowSetting: state.setShowSetting,
    }))
  );

  const appRef = useRef(app);

  const pointPositions = useRef<number[]>([]);

  useEffect(() => {
    appRef.current = app;
  }, [app]);

  const {
    addCmp,
    updateZoomLayer,
    updateSelectCmpIds,
    updateCmps,
    updateCmpById,
  } = useModelStore(
    useShallow((state) => ({
      addCmp: state.addCmp,
      updateZoomLayer: state.updateZoomLayer,
      updateSelectCmpIds: state.updateSelectCmpIds,
      updateCmps: state.updateCmps,
      updateCmpById: state.updateCmpById,
    }))
  );

  const debounceUpdateCmps = debounceUpdateCmpsWithMerge(updateCmps, 100);

  const setState = useToolbarStore((state) => state.setState);

  const onPointDown = (e: PointerEvent) => {
    const point = e.getPagePoint();
    const toolbarState = useToolbarStore.getState().state;

    if (toolbarState === ToolBarState.Text) {
      setGenCmp(
        generateCmp(CmpType.Text, {
          startX: point.x,
          startY: point.y,
          endX: point.x,
          endY: point.y,
        })
      );

      return;
    }

    if (toolbarState === ToolBarState.Pen) {
      pointPositions.current.push(1, point.x, point.y);
    }

    pointDownRef.current = point;

    if (appRef.current?.editor.selector) {
      //@ts-ignore
      appRef.current.editor.selector.hoverStroker.visible = false;
    }
  };
  const onPointMove = (e: PointerEvent) => {
    const point = e.getPagePoint();
    const toolbarState = useToolbarStore.getState().state;

    if ([ToolBarState.Dragger, ToolBarState.Select].includes(toolbarState))
      return;

    if (appRef.current) appRef.current.editor.visible = false;
    const { x, y } = point;
    if (!pointDownRef.current) return;
    const { x: startX, y: startY } = pointDownRef.current;

    let cmpType: CmpType = CmpType.Rect;

    switch (toolbarState) {
      case ToolBarState.Rect:
        cmpType = CmpType.Rect;
        break;
      case ToolBarState.Ellipse:
        cmpType = CmpType.Ellipse;
        break;
      case ToolBarState.Text:
        cmpType = CmpType.Text;
        break;
      case ToolBarState.Line:
        cmpType = CmpType.Line;
        break;
      case ToolBarState.Arrow:
        cmpType = CmpType.Arrow;
        break;
      case ToolBarState.Image:
        cmpType = CmpType.Image;
        break;
      case ToolBarState.Pen:
        cmpType = CmpType.Pen;
        break;
      default:
    }

    if (cmpType === CmpType.Pen) {
      pointPositions.current.push(2, x, y);
      setGenCmp({
        ...generateCmp(cmpType, {
          startX,
          startY,
          endX: x,
          endY: y,
        }),
        path: [...pointPositions.current],
      } as Cmp);
    } else {
      setGenCmp(
        generateCmp(cmpType, {
          startX,
          startY,
          endX: x,
          endY: y,
        })
      );
    }
  };
  const onPointUp = () => {
    pointDownRef.current = null;

    pointPositions.current = [];

    const genCmp = useCanvasStore.getState().genCmp;
    if (genCmp) {
      addCmp({ ...genCmp });
      setGenCmp(null);

      setState(ToolBarState.Select);
    }

    if (appRef.current) {
      appRef.current.editor.visible = true;
    }

    if (appRef.current?.editor.selector) {
      //@ts-ignore
      appRef.current.editor.selector.hoverStroker.visible = true;
    }
  };

  const onSelect = (evt: EditorEvent) => {
    if (!evt.value) {
      updateSelectCmpIds([]);
      return;
    }
    if (Array.isArray(evt.value) && evt.value.length === 0) return;
    const selectEl = evt.value;

    if (selectEl) {
      let selectEls: IUI[] = [];
      if (!Array.isArray(selectEl)) {
        selectEls = [selectEl];
      } else {
        selectEls = selectEl;
      }

      updateSelectCmpIds(selectEls.map((el) => el.id as string));
    }

    setState(ToolBarState.Select);
  };

  const onViewMove = debounce((evt: MoveEvent) => {
    const { x, y } = evt.target.zoomLayer || {};
    updateZoomLayer({ x, y });
  }, 500);

  const onViewZoom = debounce((evt: ZoomEvent) => {
    if (!evt.target.zoomLayer) return;
    updateZoomLayer({ scale: evt.target.zoomLayer.scaleX });
  }, 500);

  const onMoveEnd = (evt: EditorMoveEvent) => {
    let target = (evt.current as any).leafList.list as UI[];

    if (!Array.isArray(target)) {
      target = [target];
    }
    const cmps = target.map((cmp) => ({ id: cmp.id, x: cmp.x, y: cmp.y }));
    debounceUpdateCmps(cmps);
  };

  const onScaleEnd = (evt: EditorScaleEvent) => {
    let target = (evt.current as any).leafList.list as UI[];

    if (!Array.isArray(target)) {
      target = [target];
    }
    const cmps = target.map((cmp) => ({
      id: cmp.id,
      width: cmp.width,
      height: cmp.height,
    }));
    debounceUpdateCmps(cmps);
  };

  const onRotateEnd = (evt: EditorRotateEvent) => {
    let target = (evt.current as any).leafList.list as UI[];

    if (!Array.isArray(target)) {
      target = [target];
    }
    const cmps = target.map((cmp) => ({
      id: cmp.id,
      rotation: cmp.rotation,
    }));
    debounceUpdateCmps(cmps);
  };

  const onTap = (evt: PointerEvent) => {
    if (appRef.current === evt.target) {
      setShowSetting(false);
      return;
    }

    setShowSetting(true);
  };

  return {
    onPointDown,
    onPointMove,
    onPointUp,
    onSelect,
    onMoveEnd,
    onScaleEnd,
    onRotateEnd,
    onTap,
    onViewMove,
    onViewZoom,
  };
}
