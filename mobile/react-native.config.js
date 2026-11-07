module.exports = {
  dependencies: {
    // react-native-worklets MUST be natively autolinked for react-native-reanimated v4+.
    // In Reanimated v4, worklets is a separate standalone package (not bundled inside reanimated).
    // Do NOT exclude it — Reanimated's build.gradle checks for the :react-native-worklets subproject.
  },
};
