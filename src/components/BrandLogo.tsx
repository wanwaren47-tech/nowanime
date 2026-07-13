import logoAsset from "@/assets/nowanime-logo.png.asset.json";

interface Props {
  size?: number;
  withWordmark?: boolean;
  wordmarkSize?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const BrandLogo = ({ size = 56, withWordmark = true, wordmarkSize = "md", className = "" }: Props) => {
  const wm = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }[wordmarkSize];
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src={logoAsset.url}
        alt="NowAnime"
        style={{ width: size, height: size, objectFit: "contain" }}
      />
      {withWordmark && (
        <p className={`${wm} font-extrabold tracking-tight mt-1.5 leading-none`}>
          <span className="text-foreground">Now</span>
          <span className="text-primary">Anime</span>
        </p>
      )}
    </div>
  );
};

export default BrandLogo;
