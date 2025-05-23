import { v4 } from 'uuid';
import {
  ArrowCmp,
  Cmp,
  CmpType,
  ImageCmp,
  PathCmp,
  PenCmp,
  TextCmp,
} from '~/interface/cmp';
import { primaryColor } from '~/styles/theme';

export function generateCmp(
  cmpType: CmpType,
  positions: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }
): Cmp | null {
  let { startX, startY, endX, endY } = positions;

  const baseModel = {
    type: cmpType,
    id: v4(),
    name: '',
    locked: false,
    opacity: 1,
  };

  if ([CmpType.Rect, CmpType.Ellipse].includes(cmpType)) {
    let width = endX - startX;
    let height = endY - startY;
    let tempX, tempY;
    if (width < 0) {
      width = -width;
      tempX = startX;
      startX = endX;
      endX = tempX;
    }
    if (height < 0) {
      height = -height;
      tempY = startY;
      startY = endY;
      endY = tempY;
    }
    return {
      ...baseModel,
      x: startX,
      y: startY,
      width,
      height,
      fill: primaryColor,
    };
  } else if (cmpType === CmpType.Line) {
    return {
      ...baseModel,
      path: `M${startX} ${startY} L${endX} ${endY}`,
      stroke: primaryColor,
      strokeWidth: 2,
    } as PathCmp;
  } else if (cmpType === CmpType.Text) {
    return {
      ...baseModel,
      x: startX,
      y: startY,
      text: 'Text',
      fontSize: 20,
      fill: primaryColor,
    } as TextCmp;
  } else if (cmpType === CmpType.Arrow) {
    return {
      ...baseModel,
      points: [startX, startY, endX, endY],
      stroke: primaryColor,
      strokeWidth: 2,
    } as ArrowCmp;
  } else if (cmpType === CmpType.Image) {
    return {
      ...baseModel,
      x: startX,
      y: startY,
      width: endX - startX,
      height: endY - startY,
    } as ImageCmp;
  } else if (cmpType === CmpType.Pen) {
    return { ...baseModel, stroke: primaryColor, strokeWidth: 3 } as PenCmp;
  }

  return null;
}
