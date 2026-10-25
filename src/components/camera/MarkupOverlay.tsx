import { SymbolView, type SFSymbol } from "expo-symbols";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { GlassCapsule } from "@/components/ui/glass-capsule";

type ItemType = "text" | "rect" | "circle" | "arrow" | "emoji";

type MarkupItem = {
  id: number;
  type: ItemType;
  x: number;
  y: number;
  color: string;
  text: string;
  scale: number;
  rotation: number;
  length: number;
};

type Stroke = {
  id: number;
  color: string;
  width: number;
  points: { x: number; y: number }[];
};

const STROKE_WIDTHS = [3, 6, 12];
const strokePath = (pts: Stroke["points"]) => {
  const [first, ...rest] = pts;
  const d = `M${first.x} ${first.y}`;
  return rest.length
    ? d + rest.map((p) => `L${p.x} ${p.y}`).join("")
    : `${d}L${first.x} ${first.y}`;
};

const COLORS = [
  "#ffffff",
  "#ff3b30",
  "#ffcc00",
  "#34c759",
  "#0a84ff",
  "#000000",
];
const EMOJIS = [
  "😀",
  "😂",
  "😍",
  "😎",
  "👍",
  "🔥",
  "❤️",
  "⭐",
  "✅",
  "❌",
  "⚠️",
  "📍",
];
const SHAPE_SIZE = 120;
const TRASH_SIZE = 64;
const HIT_PADDING = 28;
const MIN_ARROW_LENGTH = 48;
const ARROW_HEIGHT = 36;
const MIN_SCALE = 0.3;
const MAX_SCALE = 6;

type Props = {
  active: boolean;
  onDone: () => void;
  onDiscard?: () => void;
};

export function MarkupOverlay({ active, onDone, onDiscard }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [items, setItems] = useState<MarkupItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [color, setColor] = useState(COLORS[1]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1]);

  const update = (id: number, patch: Partial<MarkupItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const add = (type: ItemType, text = "") => {
    const id = nextId.current++;
    const item: MarkupItem = {
      id,
      type,
      x: type === "text" ? width * 0.2 : (width - SHAPE_SIZE) / 2,
      y: type === "text" ? height * 0.25 : (height - SHAPE_SIZE) / 2,
      color,
      text,
      scale: 1,
      rotation: 0,
      length: SHAPE_SIZE,
    };
    setItems((prev) => [...prev, item]);
    setOpenMenu(null);
    setSelectedId(id);
    setEditingId(type === "text" ? id : null);
  };

  const finishEditing = (id: number) => {
    setEditingId(null);
    setItems((prev) => prev.filter((i) => i.id !== id || i.text.trim() !== ""));
  };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedId(null);
    setEditingId(null);
  };

  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const nextId = useRef(1);
  const [openMenu, setOpenMenu] = useState<
    "color" | "shape" | "emoji" | "draw" | null
  >(null);
  const toggle = (menu: "color" | "shape" | "emoji" | "draw") =>
    setOpenMenu((m) => (m === menu ? null : menu));

  const trashCenter = {
    x: width / 2,
    y: height - insets.bottom - Spacing.three - TRASH_SIZE / 2,
  };
  const isOverTrash = (x: number, y: number) =>
    Math.hypot(x - trashCenter.x, y - trashCenter.y) < TRASH_SIZE;

  const selected = items.find((i) => i.id === selectedId);

  const activeColor = selected?.color ?? color;

  const snapshot = useRef<MarkupItem[]>([]);
  const strokeSnapshot = useRef<Stroke[]>([]);
  useEffect(() => {
    if (active) {
      snapshot.current = items;
      strokeSnapshot.current = strokes;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const discard = () => {
    setItems(snapshot.current);
    setStrokes(strokeSnapshot.current);
    setSelectedId(null);
    setEditingId(null);
    setOpenMenu(null);
    (onDiscard ?? onDone)();
  };

  const goBack = () => {
    if (items === snapshot.current && strokes === strokeSnapshot.current) {
      return onDone();
    }
    Alert.alert(
      "Discard changes?",
      "Your markup changes will be lost if you go back.",
      [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: discard },
      ],
    );
  };

  const finish = () => {
    setSelectedId(null);
    setEditingId(null);
    setOpenMenu(null);
    onDone();
  };

  const drawing = active && openMenu === "draw";
  const drawGesture = Gesture.Pan()
    .runOnJS(true)
    .enabled(drawing)
    .minDistance(0)
    .onBegin((e) => {
      setSelectedId(null);
      setStrokes((prev) => [
        ...prev,
        {
          id: (prev[prev.length - 1]?.id ?? 0) + 1,
          color,
          width: strokeWidth,
          points: [{ x: e.x, y: e.y }],
        },
      ]);
    })
    .onUpdate((e) => {
      setStrokes((prev) =>
        prev.map((st, i) =>
          i === prev.length - 1
            ? { ...st, points: [...st.points, { x: e.x, y: e.y }] }
            : st,
        ),
      );
    });

  const chooseColor = (c: string) => {
    setColor(c);
    if (selectedId !== null) update(selectedId, { color: c });
  };

  return (
    <GestureHandlerRootView
      style={StyleSheet.absoluteFill}
      pointerEvents={active ? "box-none" : "none"}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {
          setSelectedId(null);
          setEditingId(null);
        }}
      />
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {strokes.map((st) => (
          <Path
            key={st.id}
            d={strokePath(st.points)}
            stroke={st.color}
            strokeWidth={st.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </Svg>

      {items.map((item) => (
        <MarkupItemView
          key={item.id}
          item={item}
          selected={active && item.id === selectedId}
          editing={item.id === editingId}
          onSelect={() => setSelectedId(item.id)}
          onEdit={() => {
            setSelectedId(item.id);
            setEditingId(item.id);
          }}
          onMove={(x, y) => update(item.id, { x, y })}
          onScale={(scale) => update(item.id, { scale })}
          onRotate={(rotation) => update(item.id, { rotation })}
          onResize={(patch) => update(item.id, patch)}
          onChangeText={(text) => update(item.id, { text })}
          onFinishEditing={() => finishEditing(item.id)}
          onDragChange={(x, y) => {
            setDragging(true);
            setOverTrash(isOverTrash(x, y));
          }}
          onDragEnd={(x, y) => {
            const drop = isOverTrash(x, y);
            setDragging(false);
            setOverTrash(false);
            if (drop) remove(item.id);
            return drop;
          }}
        />
      ))}

      {drawing && (
        <GestureDetector gesture={drawGesture}>
          <View style={StyleSheet.absoluteFill} />
        </GestureDetector>
      )}

      <TrashTarget
        visible={active && dragging}
        hot={overTrash}
        left={trashCenter.x - TRASH_SIZE / 2}
        top={trashCenter.y - TRASH_SIZE / 2}
      />

      {active && (
        <View style={[styles.topLeft, { top: insets.top + Spacing.three }]}>
          <GlassCapsule style={styles.back}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={goBack}
              style={({ pressed }) => [
                styles.buttonPress,
                pressed && styles.pressed,
              ]}
            >
              <SymbolView
                name={
                  {
                    ios: "chevron.left",
                    android: "arrow_back",
                    web: "arrow_back",
                  } as never
                }
                tintColor="#fff"
                size={22}
              />
            </Pressable>
          </GlassCapsule>
        </View>
      )}

      {active && (
        <View
          pointerEvents="box-none"
          style={[styles.toolbar, { bottom: insets.bottom + Spacing.three }]}
        >
          <View style={styles.menuRow}>
            {openMenu === "color" && (
              <GlassCapsule style={styles.menu}>
                {COLORS.map((c) => (
                  <Pressable
                    key={c}
                    accessibilityLabel={`Color ${c}`}
                    onPress={() => chooseColor(c)}
                    hitSlop={4}
                    style={[
                      styles.swatchRing,
                      activeColor === c && styles.swatchRingActive,
                    ]}
                  >
                    <View style={[styles.swatch, { backgroundColor: c }]} />
                  </Pressable>
                ))}
              </GlassCapsule>
            )}
            {openMenu === "shape" && (
              <GlassCapsule style={styles.menu}>
                <ToolButton
                  plain
                  label="Add rectangle"
                  name={{
                    ios: "rectangle",
                    android: "crop_square",
                    web: "crop_square",
                  }}
                  onPress={() => add("rect")}
                />
                <ToolButton
                  plain
                  label="Add circle"
                  name={{ ios: "circle", android: "circle", web: "circle" }}
                  onPress={() => add("circle")}
                />
                <ToolButton
                  plain
                  label="Add arrow"
                  name={{
                    ios: "arrow.right",
                    android: "arrow_forward",
                    web: "arrow_forward",
                  }}
                  onPress={() => add("arrow")}
                />
              </GlassCapsule>
            )}
            {openMenu === "draw" && (
              <GlassCapsule style={styles.menu}>
                {STROKE_WIDTHS.map((w) => (
                  <Pressable
                    key={w}
                    accessibilityLabel={`Line thickness ${w}`}
                    onPress={() => setStrokeWidth(w)}
                    style={[
                      styles.menuButton,
                      strokeWidth === w && styles.activeFill,
                    ]}
                  >
                    <View
                      style={{
                        width: 28,
                        height: w,
                        borderRadius: w / 2,
                        backgroundColor: color,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: "rgba(255,255,255,0.5)",
                      }}
                    />
                  </Pressable>
                ))}
                <Pressable
                  accessibilityLabel="Undo last line"
                  disabled={strokes.length === 0}
                  onPress={() => setStrokes((prev) => prev.slice(0, -1))}
                  style={({ pressed }) => [
                    styles.menuButton,
                    pressed && styles.pressed,
                    strokes.length === 0 && { opacity: 0.35 },
                  ]}
                >
                  <SymbolView
                    name={
                      {
                        ios: "arrow.uturn.backward",
                        android: "undo",
                        web: "undo",
                      } as never
                    }
                    tintColor="#fff"
                    size={22}
                  />
                </Pressable>
              </GlassCapsule>
            )}
            {openMenu === "emoji" && (
              <GlassCapsule
                style={[styles.emojiMenu, { maxWidth: width - 96 }]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.emojiMenuContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {EMOJIS.map((e) => (
                    <Pressable
                      key={e}
                      accessibilityLabel={`Add ${e}`}
                      style={styles.menuButton}
                      onPress={() => add("emoji", e)}
                    >
                      <Text style={styles.emojiButton}>{e}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </GlassCapsule>
            )}
          </View>
          <View style={styles.bar}>
            <View>
              <ToolCapsule
                label="Color"
                active={openMenu === "color"}
                onPress={() => toggle("color")}
              >
                <View
                  style={[styles.colorDot, { backgroundColor: activeColor }]}
                />
              </ToolCapsule>
            </View>
            <View>
              <ToolButton
                label="Shapes"
                name={{
                  ios: "square.on.circle",
                  android: "category",
                  web: "category",
                }}
                active={openMenu === "shape"}
                onPress={() => toggle("shape")}
              />
            </View>
            <View>
              <ToolButton
                label="Freeform"
                name={{ ios: "scribble", android: "draw", web: "draw" }}
                active={openMenu === "draw"}
                onPress={() => toggle("draw")}
              />
            </View>
            <View>
              <ToolCapsule
                label="Emoji"
                active={openMenu === "emoji"}
                onPress={() => toggle("emoji")}
              >
                <Text style={styles.emojiButton}>😀</Text>
              </ToolCapsule>
            </View>
            <View>
              <ToolButton
                label="Add text"
                name={{ ios: "textformat", android: "title", web: "title" }}
                onPress={() => add("text")}
              />
            </View>
            <GlassCapsule style={styles.done}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done"
                onPress={finish}
                style={({ pressed }) => [
                  styles.donePress,
                  pressed && styles.pressed,
                ]}
              >
                <SymbolView
                  name={
                    {
                      ios: "checkmark",
                      android: "check",
                      web: "check",
                    } as never
                  }
                  tintColor="#fff"
                  size={24}
                  weight="bold"
                />
              </Pressable>
            </GlassCapsule>
          </View>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const BOUNCE = { damping: 14, stiffness: 240, mass: 0.7 };

function TrashTarget({
  visible,
  hot,
  left,
  top,
}: {
  visible: boolean;
  hot: boolean;
  left: number;
  top: number;
}) {
  const show = useSharedValue(0);
  const heat = useSharedValue(0);

  useEffect(() => {
    show.value = withSpring(
      visible ? 1 : 0,
      visible ? BOUNCE : { damping: 20 },
    );
  }, [visible, show]);

  useEffect(() => {
    heat.value = withSpring(hot ? 1 : 0, BOUNCE);
  }, [hot, heat]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, show.value),
    backgroundColor: interpolateColor(
      Math.min(1, Math.max(0, heat.value)),
      [0, 1],
      ["rgba(110,110,118,0.75)", "#ff3b30"],
    ),
    transform: [
      { translateY: (1 - show.value) * 40 },
      { scale: show.value * (1 + heat.value * 0.3) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.trash, { left, top }, style]}
    >
      <SymbolView
        name={{ ios: "trash", android: "delete", web: "delete" } as never}
        tintColor="#fff"
        size={28}
      />
    </Animated.View>
  );
}

function ToolButton({
  label,
  name,
  onPress,
  active,
  plain,
}: {
  label: string;
  name: { ios: SFSymbol; android: string; web: string };
  onPress: () => void;
  active?: boolean;
  plain?: boolean;
}) {
  const icon = <SymbolView name={name as never} tintColor="#fff" size={22} />;
  if (plain) {
    return (
      <Pressable
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.menuButton,
          pressed && styles.pressed,
          active && styles.activeFill,
        ]}
        onPress={onPress}
      >
        {icon}
      </Pressable>
    );
  }
  return (
    <ToolCapsule label={label} active={active} onPress={onPress}>
      {icon}
    </ToolCapsule>
  );
}

function ToolCapsule({
  label,
  active,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <GlassCapsule style={styles.button}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.buttonPress,
          pressed && styles.pressed,
          active && styles.activeFill,
        ]}
      >
        {children}
      </Pressable>
    </GlassCapsule>
  );
}

type ItemViewProps = {
  item: MarkupItem;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onMove: (x: number, y: number) => void;
  onScale: (scale: number) => void;
  onRotate: (rotation: number) => void;
  onResize: (patch: Partial<MarkupItem>) => void;
  onChangeText: (text: string) => void;
  onFinishEditing: () => void;
  onDragChange: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => boolean;
};

function MarkupItemView({
  item,
  selected,
  editing,
  onSelect,
  onEdit,
  onMove,
  onScale,
  onRotate,
  onResize,
  onChangeText,
  onFinishEditing,
  onDragChange,
  onDragEnd,
}: ItemViewProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const pinchScale = useSharedValue(1);
  const rotateDelta = useSharedValue(0);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!editing)
    .maxPointers(1)
    .onBegin(onSelect)
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      onDragChange(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      if (!onDragEnd(e.absoluteX, e.absoluteY)) {
        onMove(item.x + e.translationX, item.y + e.translationY);
      }
      tx.value = 0;
      ty.value = 0;
    });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .enabled(!editing)
    .onEnd((_e, success) => {
      if (!success) return;
      if (item.type === "text" && selected) onEdit();
      else onSelect();
    });

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .enabled(!editing)
    .onBegin(onSelect)
    .onUpdate((e) => {
      pinchScale.value = e.scale;
    })
    .onEnd((e) => {
      onScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, item.scale * e.scale)));
      pinchScale.value = 1;
    });

  const rotate = Gesture.Rotation()
    .runOnJS(true)
    .enabled(!editing)
    .onBegin(onSelect)
    .onUpdate((e) => {
      rotateDelta.value = e.rotation;
    })
    .onEnd((e) => {
      onRotate(item.rotation + e.rotation);
      rotateDelta.value = 0;
    });

  const startLength = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Dragging an end handle changes the length along the arrow's axis while
  // the opposite end stays fixed on screen.
  const resizeGesture = (side: 1 | -1) =>
    Gesture.Pan()
      .runOnJS(true)
      .maxPointers(1)
      .onBegin(() => {
        startLength.value = item.length;
        startX.value = item.x;
        startY.value = item.y;
      })
      .onUpdate((e) => {
        const start = {
          length: startLength.value,
          x: startX.value,
          y: startY.value,
        };
        const dx = Math.cos(item.rotation);
        const dy = Math.sin(item.rotation);
        const along = (e.translationX * dx + e.translationY * dy) / item.scale;
        const length = Math.max(MIN_ARROW_LENGTH, start.length + side * along);
        const shift = side * ((length - start.length) / 2) * item.scale;
        const cx = start.x + (start.length + 2 * HIT_PADDING) / 2 + shift * dx;
        const cy = start.y + (ARROW_HEIGHT + 2 * HIT_PADDING) / 2 + shift * dy;
        onResize({
          length,
          x: cx - (length + 2 * HIT_PADDING) / 2,
          y: cy - (ARROW_HEIGHT + 2 * HIT_PADDING) / 2,
        });
      });
  const rightHandle = resizeGesture(1);
  const leftHandle = resizeGesture(-1);

  const gesture = Gesture.Exclusive(
    Gesture.Simultaneous(pan, pinch, rotate),
    tap,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      {
        scale: Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, item.scale * pinchScale.value),
        ),
      },
      { rotate: `${item.rotation + rotateDelta.value}rad` },
    ],
  }));

  return (
    <Animated.View
      style={[styles.itemOuter, { left: item.x, top: item.y }, animatedStyle]}
    >
      <GestureDetector gesture={gesture}>
        <View style={[styles.item, selected && styles.itemSelected]}>
          {item.type === "emoji" ? (
            <Text style={styles.emoji}>{item.text}</Text>
          ) : item.type === "text" ? (
            editing ? (
              <TextInput
                autoFocus
                multiline
                value={item.text}
                onChangeText={onChangeText}
                onBlur={onFinishEditing}
                placeholder="Type…"
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={[styles.text, { color: item.color }]}
              />
            ) : (
              <Text style={[styles.text, { color: item.color }]}>
                {item.text}
              </Text>
            )
          ) : item.type === "arrow" ? (
            <View style={[styles.arrow, { width: item.length }]}>
              <View
                style={[styles.arrowShaft, { backgroundColor: item.color }]}
              />
              <View
                style={[styles.arrowHead, { borderLeftColor: item.color }]}
              />
            </View>
          ) : (
            <View
              style={[
                styles.shape,
                { borderColor: item.color },
                item.type === "circle" && styles.circle,
              ]}
            />
          )}
        </View>
      </GestureDetector>
      {item.type === "arrow" && selected && !editing && (
        <>
          <GestureDetector gesture={leftHandle}>
            <View style={[styles.handle, styles.handleLeft]}>
              <View style={styles.grip} />
            </View>
          </GestureDetector>
          <GestureDetector gesture={rightHandle}>
            <View style={[styles.handle, styles.handleRight]}>
              <View style={styles.grip} />
            </View>
          </GestureDetector>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  trash: {
    position: "absolute",
    width: TRASH_SIZE,
    height: TRASH_SIZE,
    borderRadius: TRASH_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    position: "absolute",
    right: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  topLeft: { position: "absolute", left: Spacing.three },
  back: { width: 48, height: 48, borderRadius: 24 },
  menuRow: { alignItems: "flex-end" },
  bar: {
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.two,
  },
  button: { width: 48, height: 48, borderRadius: 24 },
  buttonPress: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFill: { backgroundColor: "rgba(10,132,255,0.85)" },
  pressed: { backgroundColor: "rgba(255,255,255,0.22)" },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    height: 48,
    borderRadius: 24,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#fff",
  },
  swatchRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchRingActive: { borderColor: "#fff" },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.5)",
  },
  done: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(52,199,89,0.85)",
  },
  donePress: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemOuter: { position: "absolute" },
  item: { padding: HIT_PADDING, borderRadius: 6 },
  handle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: HIT_PADDING + 8,
    alignItems: "center",
    justifyContent: "center",
  },
  handleLeft: { left: -8 },
  handleRight: { right: -8 },
  grip: {
    width: 8,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.4)",
  },
  itemSelected: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    borderStyle: "dashed",
    padding: HIT_PADDING - 1,
  },
  text: {
    fontSize: 28,
    fontWeight: "700",
    minWidth: 60,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 3,
  },
  shape: {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    borderWidth: 4,
    borderRadius: 6,
  },
  arrow: {
    width: SHAPE_SIZE,
    height: ARROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  arrowShaft: { flex: 1, height: 6 },
  arrowHead: {
    width: 0,
    height: 0,
    borderTopWidth: 18,
    borderBottomWidth: 18,
    borderLeftWidth: 30,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  emoji: { fontSize: 64, lineHeight: 80 },
  emojiButton: { fontSize: 24 },
  emojiMenu: {
    flexGrow: 0,
    height: 48,
    borderRadius: 24,
  },
  emojiMenuContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  circle: { borderRadius: SHAPE_SIZE / 2 },
});
