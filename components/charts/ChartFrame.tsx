import React, { useState } from "react";
import { View, LayoutChangeEvent, ViewStyle } from "react-native";

interface ChartFrameProps {
  height: number;
  style?: ViewStyle;
  /** Rendered once the container's real width is known — never with a guessed width. */
  children: (width: number) => React.ReactNode;
}

/**
 * Measures the space actually available and hands it to the chart. Charts sized
 * from a hard-coded width overflow their card on narrow phones, which is how
 * the bar and line charts were being clipped on 360dp screens.
 */
export function ChartFrame({ height, style, children }: ChartFrameProps) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.floor(e.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };

  return (
    <View onLayout={onLayout} style={[{ width: "100%", height }, style]}>
      {width > 0 ? children(width) : null}
    </View>
  );
}
