import { Box, BoxProps } from '@mui/material';
import React from 'react';
import SimpleBar, { Props as SimpleBarProps } from 'simplebar-react';
import 'simplebar/dist/simplebar.min.css';

export type ScrollBoxProps = BoxProps & {
  fillHeight?: boolean;
  shadows?: boolean | 'horizontal' | 'vertical';
  shadowTintColor?: string;
  scrollerProps?: BoxProps & SimpleBarProps;
};

function ScrollBox(
  {
    scrollerProps,
    fillHeight,
    shadows = true,
    shadowTintColor = 'rgba(0,0,0,.1)',
    children,
    ...props
  }: ScrollBoxProps,
  ref: React.Ref<unknown>
) {
  const scrollableNodeRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <Box {...props} ref={ref} position="relative" overflow="hidden">
      <Box
        component={SimpleBar}
        height={1}
        {...scrollerProps}
        scrollableNodeProps={{ ref: scrollableNodeRef }}
        sx={{
          ...(fillHeight && {
            '.simplebar-content-wrapper, .simplebar-content': {
              height: '100% !important',
            },
          }),
          ...scrollerProps?.sx,
        }}
      >
        {children}
      </Box>
      {shadows && (
        <>
          {(shadows === true || shadows === 'horizontal') && (
            <ShadowGroup
              orientation="horizontal"
              scrollerRef={scrollableNodeRef}
              tint={shadowTintColor}
            />
          )}
          {(shadows === true || shadows === 'vertical') && (
            <ShadowGroup
              orientation="vertical"
              scrollerRef={scrollableNodeRef}
              tint={shadowTintColor}
            />
          )}
        </>
      )}
    </Box>
  );
}
type ShadowGroupProps = {
  orientation: 'horizontal' | 'vertical';
  scrollerRef: React.MutableRefObject<HTMLDivElement | null>;
  tint: string;
};

function ShadowGroup({ orientation, scrollerRef, tint }: ShadowGroupProps) {
  const { showStart, showEnd } = useShadowGroupState(scrollerRef, orientation);

  if (orientation === 'vertical') {
    return (
      <React.Fragment>
        <Shadow
          position="top"
          visible={showStart}
          width="unset"
          height={10}
          tint={tint}
        />
        <Shadow
          position="bottom"
          visible={showEnd}
          top="unset"
          height={10}
          tint={tint}
        />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Shadow
        position="left"
        visible={showStart}
        right="unset"
        width={10}
        tint={tint}
      />
      <Shadow
        position="right"
        visible={showEnd}
        left="unset"
        width={10}
        tint={tint}
      />
    </React.Fragment>
  );
}

type ShadowProps = Omit<BoxProps, 'position'> & {
  visible: boolean;
  position: string;
  tint: string;
};

function Shadow({ visible, position, tint, ...props }: ShadowProps) {
  return (
    <Box
      position="absolute"
      left={0}
      right={0}
      top={0}
      bottom={0}
      {...props}
      sx={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 125ms',
        backgroundImage: `linear-gradient(to ${position}, transparent, ${tint})`,
        ...props.sx,
      }}
    />
  );
}

function useShadowGroupState(
  scrollerRef: React.MutableRefObject<HTMLDivElement | null>,
  orientation: ShadowGroupProps['orientation']
) {
  const [showStart, setShowStart] = React.useState(false);
  const [showEnd, setShowEnd] = React.useState(false);
  const cachedStateRef = React.useRef({
    canShowStart: false,
    canShowEnd: false,
  });

  const doUpdate = React.useCallback(() => {
    const node = scrollerRef.current;

    if (node) {
      const canShowStart =
        orientation === 'horizontal' ? node.scrollLeft > 0 : node.scrollTop > 0;

      const canShowEnd =
        orientation === 'horizontal'
          ? node.scrollLeft + node.offsetWidth < node.scrollWidth
          : node.scrollTop + node.offsetHeight < node.scrollHeight;

      if (canShowStart !== cachedStateRef.current.canShowStart) {
        setShowStart(canShowStart);
      }

      if (canShowEnd !== cachedStateRef.current.canShowEnd) {
        setShowEnd(canShowEnd);
      }

      cachedStateRef.current = {
        canShowStart,
        canShowEnd,
      };
    }
  }, [scrollerRef, orientation]);

  React.useEffect(() => {
    const node = scrollerRef.current;

    if (node) {
      doUpdate();
      node.addEventListener('scroll', doUpdate);
      return () => {
        node.removeEventListener('scroll', doUpdate);
      };
    }
  }, [doUpdate, scrollerRef]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', doUpdate);
      return () => {
        window.removeEventListener('resize', doUpdate);
      };
    }
  }, [doUpdate]);

  return { showStart, showEnd };
}

export default React.forwardRef(ScrollBox);
