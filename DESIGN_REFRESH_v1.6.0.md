# Smart Battery Calculator — Landing Visual Refresh v1.6.0

This release replaces the previous static dashboard illustration with a lightweight graphical energy-ecosystem hero designed specifically for the Smart Battery Calculator.

## Design direction

- Premium clean-tech visual language instead of a generic technology/WebGL demo.
- Exact conceptual flow is visible: sunlight → solar PV → battery storage → home demand.
- Animated warm solar transfer and cyan electricity flow reinforce the purpose without distracting from the calculator CTA.
- Pointer parallax adds depth while preserving normal scrolling and touch behaviour.
- Glass-style status cards, a restrained isometric scene and low-contrast grid background create depth without heavy post-processing.
- The hero copy is rewritten around the real project workflow rather than marketing claims.

## Performance choices

- No Three.js dependency was added.
- No WebGL context is created on the landing page.
- The illustration is SVG + CSS with only six animated energy particles.
- Parallax changes one container transform via requestAnimationFrame.
- No large raster assets, HDR environments, shadows, bloom or post-processing are loaded.
- `prefers-reduced-motion` disables particle and pulse animation.

This approach gives the visual depth of an animated energy scene while remaining substantially lighter than a continuously-rendering React Three Fiber canvas.
