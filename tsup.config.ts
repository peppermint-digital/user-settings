import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['resources/js/src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    // React bleibt beim Produkt: Zwei React-Instanzen im selben Baum enden in
    // „Invalid hook call", und das findet niemand schnell. Inertia aus
    // demselben Grund — `usePage` liest den Seitenzustand aus einem Context,
    // und ein zweites Inertia hat einen eigenen, leeren.
    external: ['react', 'react-dom', '@inertiajs/react'],
});
