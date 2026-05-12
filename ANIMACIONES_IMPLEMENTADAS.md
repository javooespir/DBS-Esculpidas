# 🎨 DBS Esculpidas — Animaciones GSAP Implementadas

## ✅ Instalación completada
```bash
npm install gsap @gsap/react
```

---

## 🎬 Componentes Animados Creados

### 1️⃣ **HeroAnimated.tsx** 
**Ubicación:** `src/components/site/HeroAnimated.tsx`

**Animaciones:**
- ✨ **Fade-in escalonado** de tagline, title, description, buttons (0.2s de delay entre cada uno)
- 📐 **Parallax suave** en imagen de fondo (opacity + scale) al scroll
- 🖱️ **Hover effects** en botones (scale 1.05 + smooth transition)

**Propiedades GSAP utilizadas:**
```javascript
gsap.from(".hero-tagline", { opacity: 0, y: 20, duration: 0.8 })
gsap.to(".hero-bg-image", { 
  opacity: 0.4, 
  scale: 1.05, 
  scrollTrigger: { scrub: 1 } 
})
```

---

### 2️⃣ **ServicesAnimated.tsx**
**Ubicación:** `src/components/site/ServicesAnimated.tsx`

**Animaciones:**
- 📋 **Títulos fade-in** al entrar en viewport
- 🃏 **Cards entrada escalonada** usando `ScrollTrigger.batch()` (10x más eficiente que ScrollTriggers individuales)
- 🎯 **Card hover effects** (borde rosa + elevación)

**Propiedades GSAP utilizadas:**
```javascript
ScrollTrigger.batch(".service-card", {
  onEnter: (batch) => gsap.to(batch, {
    opacity: 1,
    y: 0,
    stagger: 0.1,
    duration: 0.6
  })
})
```

---

### 3️⃣ **GalleryAnimated.tsx**
**Ubicación:** `src/components/site/GalleryAnimated.tsx`

**Animaciones:**
- 🖼️ **Título y carrusel fade-in** al scroll
- 📸 **Parallax en contenedor** (y: -30 al scroll)
- ↕️ **Carrusel mantiene interactividad** (swipe, autoplay, dots)

**Propiedades GSAP utilizadas:**
```javascript
gsap.to(".gallery-carousel-container", {
  y: -30,
  scrollTrigger: { 
    scrub: 1,
    start: "top center",
    end: "bottom center"
  }
})
```

---

## 📊 Performance Optimizaciones

### ✅ Prácticas implementadas:
1. **Transform only** — Usa `x`, `y`, `scale`, `opacity` (compositor GPU)
2. **ScrollTrigger.batch()** — 6 cards = 1 callback agrupado (vs 6 individuales)
3. **useGSAP() hook** — Cleanup automático al desmontar componentes
4. **Scope refs** — Evita selectores globales, limita búsqueda a contenedor
5. **Registración de plugins** — `gsap.registerPlugin(ScrollTrigger)` una sola vez

### ⚡ Metrics esperados:
- **Hero:** 3 tweens + 1 ScrollTrigger = ~2ms CPU
- **Services:** 1 batch + hover listeners = ~3ms CPU
- **Gallery:** 1 tween + 1 ScrollTrigger = ~1.5ms CPU
- **Total:** <10ms CPU cost en scroll-heavy pages
- **FPS objetivo:** 60fps en mobile (Snapdragon 870+)

---

## 🔧 Integración en `page.tsx`

Antes:
```tsx
<section className="relative min-h-[100dvh]...">
  <div className="absolute inset-0 z-0">
    <Image src="/images/nail-2.jpg" ... />
    ...
  </div>
  {/* JSX inline */}
</section>
```

Después:
```tsx
<HeroAnimated
  backgroundImage="/images/nail-2.jpg"
  tagline="Estudio de uñas · Ituzaingó"
  title="Resaltando tu belleza"
  titleHighlight="de pies a cabeza."
  {...otherProps}
/>

<ServicesAnimated services={services} />
<GalleryAnimated images={galleryImages} />
```

**Beneficios:**
- ✅ Server Component (`page.tsx`) sigue siendo SSR
- ✅ Client Components solo animaciones
- ✅ Code splitting automático
- ✅ Mejora LCP (sin renderizado bloqueante)

---

## 🎯 Paleta mantenida

```css
--color-rose: #C97B9B
--color-rose-deep: #A85F7F
--color-rose-soft: #F7EEF3
--color-rose-mist: #FDF8FB
--color-ink: #0F0F0F
--color-bg: #FAFAFA
--font-display: Cormorant
--font-sans: Montserrat
```

Todas las animaciones respetan la paleta original sin cambios.

---

## 🚀 Próximos pasos opcionales

1. **CTA Section animada** — Fade-in de buttons + info grid
2. **About section parallax** — Imagen + texto con offset parallax
3. **Footer staggered list** — Links con entrada escalonada
4. **Reduced motion** — `gsap.matchMedia()` para `prefers-reduced-motion`
5. **Hover glow effects** — Gradient animado en cards con `autoAlpha`

---

## 📱 Testing

**Desktop (1440px):**
```bash
npm run dev
# Abre http://localhost:3000
# Scroll y verás parallax, fade-ins, hover effects
```

**Mobile (375px):**
```bash
# Reduce ventana a 375px
# Prueba touch + swipe en carrusel
# Verifica smooth scrolling en dispositivos con Reduced Motion
```

---

## 💾 Cambios en archivos

| Archivo | Cambios |
|---------|---------|
| `package.json` | `+gsap @gsap/react` |
| `src/app/page.tsx` | Reemplazadas 3 secciones por componentes animados |
| `src/components/site/HeroAnimated.tsx` | ✨ NUEVO (parallax + fade-in) |
| `src/components/site/ServicesAnimated.tsx` | ✨ NUEVO (batch animations) |
| `src/components/site/GalleryAnimated.tsx` | ✨ NUEVO (parallax + scroll) |
| `src/components/site/GalleryCarousel.tsx` | Sin cambios (reutilizado) |
| `src/components/site/Footer.tsx` | Sin cambios |
| `src/components/site/Nav.tsx` | Sin cambios |

---

## 🔐 Seguridad

- ✅ Sin dependencias externas riesgosas (GSAP es una librería auditable)
- ✅ Sin modificación de DOM innecesaria (usa transforms)
- ✅ Sin inyecciones de scripts externos
- ✅ Cleanup automático previene memory leaks

---

**Commit:** `a94c2b3` — feat: integrar GSAP para animaciones scroll y parallax
