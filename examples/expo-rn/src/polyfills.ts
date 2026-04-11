// Privy (and the ethers/viem libraries underneath) rely on a web-standard
// crypto.getRandomValues() being available at module load time. React
// Native does not provide one by default. Importing this package installs
// a native implementation backed by SecureRandom on Android and
// SecRandomCopyBytes on iOS.
//
// This file must be the very first import in App.tsx — before any Privy,
// viem, or terminal-auth-sdk import — because some libraries read
// `crypto.getRandomValues` eagerly at module load.
import "react-native-get-random-values";
