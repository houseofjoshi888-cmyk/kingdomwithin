import Image from "next/image";

export function BrandMark({ priority = false }: { priority?: boolean }) {
  return <span className="brand-mark" aria-hidden="true"><Image src="/house-of-joshi-mark.png" alt="" width={42} height={42} priority={priority} /></span>;
}
