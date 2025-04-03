import { useEffect } from 'react';
import { UI } from 'leafer-ui';
import usePrevious from './usePrevious';

export default function usePropsUpdate<T extends UI>(
  leaferInstance: T | undefined,
  props: any
) {
  const lastProps = usePrevious(props) as any;

  useEffect(() => {
    if (!leaferInstance) return;

    for (const key in props) {
      if (lastProps[key] !== props[key]) {
        leaferInstance.setAttr(key, props[key]);
      }
    }
  }, [props, leaferInstance]);

  return null;
}
