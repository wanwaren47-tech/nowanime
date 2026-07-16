import logoAsset from "@/assets/nowanime-logo.png.asset.json";

interface Props {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

// The official logo already contains the "NOW ANIME" wordmark, so we render
// image only. `withWordmark` is kept for API compatibility but ignored.
const BrandLogo = ({ size = 96, className = "" }: Props) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src={logoAsset.url}
        alt="NowAnime"
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    </div>
  );
};

export default BrandLogo;
