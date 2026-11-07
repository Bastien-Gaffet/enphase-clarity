import React, { useState } from "react";
import { LayoutChangeEvent, View, ViewStyle } from "react-native";

/**
 * Hands a child the width actually available. Charts sized from a hard-coded
 * width overflow their card on narrow phones.
 */
export function Frame({
  height,
  style,
  children,
}: {
  /** Omit when the child derives its own height from the measured width. */
  height?: number;
  style?: ViewStyle;
  children: (width: number) => React.ReactNode;
}) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.floor(e.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };

  return (
    <View onLayout={onLayout} style={[{ width: "100%" }, height != null ? { height } : null, style]}>
      {width > 0 ? children(width) : null}
    </View>
  );
}
