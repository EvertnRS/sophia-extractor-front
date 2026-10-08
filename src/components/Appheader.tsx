import { useEffect, useRef, useState } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { Activity, House, Users, type LucideIcon } from "lucide-react";
import { useAuth } from "../context/useAuth";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/predicao", label: "Predição", icon: Activity },
  { to: "/admin/usuarios", label: "Gestão de usuários", icon: Users, adminOnly: true },
];

/*
 * Geometria da navbar (px). Tudo em "coordenadas da barra": y = 0 é a borda
 * superior da barra branca. A bolha do item ativo é um círculo que sobrepõe
 * a borda superior, e a barra ganha um recorte circular (com cantos
 * arredondados nas pontas) em volta dela, como na referência.
 */
const ITEM_WIDTH = 140;
const BAR_HEIGHT = 50;
const BAR_RADIUS = 22; // cantos externos da barra
const BUBBLE_SIZE = 40;
const BUBBLE_CENTER_Y = 8; // centro da bolha, medido a partir do topo da barra
const NOTCH_RADIUS = 24; // bolha (20) + 4px de "respiro" entre ela e a barra
const NOTCH_FILLET = 6; // raio da curva que suaviza o encontro recorte/borda

/** Contorno da barra com o recorte centrado em `cx`. */
function buildBarPath(cx: number, width: number) {
  const r = NOTCH_RADIUS;
  const f = NOTCH_FILLET;
  const cy = BUBBLE_CENTER_Y;

  // Círculo de suavização tangente à borda superior (y = 0) e, por fora, ao
  // círculo do recorte.
  const filletDx = Math.sqrt((r + f) ** 2 - (f - cy) ** 2);
  const k = r / (r + f);
  const tangentDx = filletDx * k;
  const tangentY = cy + (f - cy) * k;

  const h = BAR_HEIGHT;
  const rc = BAR_RADIUS;

  return [
    `M ${rc} 0`,
    `H ${cx - filletDx}`,
    `A ${f} ${f} 0 0 1 ${cx - tangentDx} ${tangentY}`,
    `A ${r} ${r} 0 1 0 ${cx + tangentDx} ${tangentY}`,
    `A ${f} ${f} 0 0 1 ${cx + filletDx} 0`,
    `H ${width - rc}`,
    `A ${rc} ${rc} 0 0 1 ${width} ${rc}`,
    `V ${h - rc}`,
    `A ${rc} ${rc} 0 0 1 ${width - rc} ${h}`,
    `H ${rc}`,
    `A ${rc} ${rc} 0 0 1 0 ${h - rc}`,
    `V ${rc}`,
    `A ${rc} ${rc} 0 0 1 ${rc} 0`,
    "Z",
  ].join(" ");
}

/** Anima suavemente um número até `target` (usado para deslizar o recorte). */
function useTweenedNumber(target: number, duration = 320) {
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    const from = currentRef.current;
    if (from === target) return;

    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const t = instant ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;

      currentRef.current = next;
      setValue(next);

      if (t < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  const foundIndex = items.findIndex((item) =>
    matchPath({ path: item.to, end: item.to === "/" }, pathname)
  );
  const activeIndex = Math.max(0, foundIndex);
  const ActiveIcon = items[activeIndex].icon;

  const barWidth = items.length * ITEM_WIDTH;
  const notchX = useTweenedNumber(activeIndex * ITEM_WIDTH + ITEM_WIDTH / 2);

  return (
    <header className="border-b border-blush">
      {/* Desktop: `1fr auto 1fr` mantém a navbar centralizada de verdade.
          Mobile: a navbar desce para uma segunda linha. */}
      <div className="grid grid-cols-2 items-center gap-x-4 px-6 sm:grid-cols-[1fr_auto_1fr]">
        <Link to="/" className="justify-self-start py-3 sm:py-0">
          <img src="/LogoNav.svg" alt="SophIA" className="h-11 w-auto" />
        </Link>

        {/* pt-4 = espaço para a bolha que sobressai do topo da barra. */}
        <nav
          aria-label="Navegação principal"
          className="order-3 col-span-2 justify-self-center pb-2 pt-4 sm:order-none sm:col-span-1"
        >
          <div
            className="relative"
            style={{ width: barWidth, height: BAR_HEIGHT }}
          >
            <svg
              aria-hidden="true"
              width={barWidth}
              height={BAR_HEIGHT}
              className="absolute left-0 top-0 overflow-visible"
            >
              <path
                d={buildBarPath(notchX, barWidth)}
                className="fill-white stroke-blush"
                strokeWidth={1}
              />
            </svg>

            {/* Bolha única que desliza junto com o recorte. */}
            <span
              aria-hidden="true"
              className="absolute z-10 flex items-center justify-center rounded-full bg-espresso text-white"
              style={{
                width: BUBBLE_SIZE,
                height: BUBBLE_SIZE,
                left: notchX - BUBBLE_SIZE / 2,
                top: BUBBLE_CENTER_Y - BUBBLE_SIZE / 2,
              }}
            >
              <ActiveIcon size={20} strokeWidth={2} />
            </span>

            <ul className="relative z-20 flex">
              {items.map((item, index) => {
                const Icon = item.icon;
                const isActive = index === activeIndex;

                return (
                  <li key={item.to} style={{ width: ITEM_WIDTH }}>
                    <Link
                      to={item.to}
                      aria-current={isActive ? "page" : undefined}
                      className="group flex flex-col items-center rounded-3xl pt-2 outline-none focus-visible:ring-2 focus-visible:ring-maroon"
                      style={{ height: BAR_HEIGHT }}
                    >
                      {/* O ícone da bolha cobre este; aqui ele só some
                          suavemente quando o item passa a ser o ativo. */}
                      <Icon
                        size={20}
                        strokeWidth={1.75}
                        className={`transition-opacity duration-300 ${
                          isActive
                            ? "opacity-0"
                            : "text-mauve group-hover:text-espresso"
                        }`}
                      />
                      <span
                        className={`mt-[5px] whitespace-nowrap text-xs leading-[14px] transition-colors ${
                          isActive
                            ? "font-bold text-espresso"
                            : "font-medium text-mauve group-hover:text-espresso"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {user && (
          <div className="flex items-center gap-5 justify-self-end">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink">{user.email}</p>
              <p className="text-xs uppercase tracking-wide text-mauve">
                {user.role === "admin" ? "Administrador" : "Usuário"}
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-full border border-blush px-4 py-1.5 text-sm text-espresso transition hover:bg-blush-soft"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}