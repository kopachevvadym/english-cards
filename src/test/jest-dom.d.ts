// Ensure TypeScript sees the @testing-library/jest-dom matcher augmentations.
// This fixes TS2339 errors like: Property 'toBeInTheDocument' does not exist on type 'JestMatchers<...>'.
import '@testing-library/jest-dom'
