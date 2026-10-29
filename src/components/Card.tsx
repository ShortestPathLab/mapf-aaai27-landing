import { slugifyStr } from "@utils/slugify";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import Datetime from "./Datetime";

export interface Props {
  href?: string;
  frontmatter: any;
  secHeading?: boolean;
}

export function CardBase({
  primary,
  secondary,
  description,
  href,
  slug,
}: {
  primary?: string;
  secondary?: ReactNode;
  description?: ReactNode;
  href?: string;
  secHeading?: boolean;
  slug?: string;
}) {
  const headerProps = {
    style: { viewTransitionName: slugifyStr(slug ?? primary ?? "") },
    className: href ? `hover:underline` : "",
  };
  return (
    <li className="my-6 list-none">
      <a
        href={href}
        className={`mb-2 inline-block text-lg font-normal ${href ? "underline-offset-4 focus-visible:no-underline focus-visible:underline-offset-0" : ""}`}
      >
        {true ? (
          <h2 {...headerProps}>{primary}</h2>
        ) : (
          <h3 {...headerProps}>{primary}</h3>
        )}
      </a>
      <p className="text-sm">{secondary}</p>
      <div className="mt-2">{description}</div>
    </li>
  );
}

export function Parallax({
  children,
  strength = 0.1,
  ...props
}: ComponentProps<"div"> & { strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const controller = new AbortController();
    const { signal } = controller;

    const update = () => {
      if (!ref.current) return;

      const { top, height } = ref.current.getBoundingClientRect();
      const y = top + height / 2 - window.innerHeight / 2;
      ref.current.style.setProperty(
        "--parallax-y",
        motion.matches ? "0px" : `${y * -strength}px`
      );
    };
    document.addEventListener("scroll", update, { signal, passive: true });
    window.addEventListener("resize", update, { signal });
    motion.addEventListener("change", update, { signal });

    update();

    return () => controller.abort();
  }, [strength]);

  return (
    <div {...props} ref={ref}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ transform: "translateY(var(--parallax-y, 0px))" }}
      >
        {children}
      </div>
    </div>
  );
}

export function ParallaxImage({
  image,
  offset = "50%",
  ...props
}: {
  image?: string;
  offset?: string;
} & ComponentProps<"div">) {
  return (
    <Parallax
      {...props}
      className={`h-48 w-full rounded-lg bg-cover bg-center ${props.className ?? ""}`}
      style={{
        backgroundImage: `url(${image})`,
        backgroundPositionY: `calc(${offset} + var(--parallax-y, 0px))`,
        ...props.style,
      }}
    />
  );
}

export default function Card({ href, frontmatter, secHeading = true }: Props) {
  const { title, pubDatetime, modDatetime, description } = frontmatter;

  return (
    <CardBase
      href={href}
      secHeading={secHeading}
      primary={title}
      description={description}
      secondary={
        <Datetime pubDatetime={pubDatetime} modDatetime={modDatetime} />
      }
    />
  );
}
